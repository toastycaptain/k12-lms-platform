# Codex Instructions — AI Streaming & Async Processing

## Objective

Add streaming and async AI generation per Tech Spec §2.7 and §2.10. Currently all AI generation is synchronous — the Rails controller calls the AI Gateway inline and blocks until completion. This task adds: (1) a streaming endpoint so the frontend can display tokens as they arrive, (2) an async Sidekiq job for long-running AI tasks, and (3) frontend streaming display in the AI Assistant Panel.

---

## What Already Exists (DO NOT recreate)

### Backend
- `AiGatewayClient` service (`apps/core/app/services/ai_gateway_client.rb`)
  - Single class method: `self.generate(provider:, model:, messages:, task_type:, max_tokens:, temperature:)`
  - POSTs to AI Gateway `/v1/generate` synchronously via Faraday
  - Returns response body on success, raises `AiGatewayError` on failure
- `AiInvocation` model — tracks task_type, status (pending/running/completed/failed), tokens, duration, context
- `AiInvocationsController#create` — synchronous flow: create invocation → call gateway → mark complete/failed → return response
- `AiProviderConfig` model — provider settings, default model, API keys
- `AiTaskPolicy` model — per-task-type controls (enabled, allowed_roles, model_override, max_tokens, temperature)
- AI Gateway (FastAPI) exposes both `POST /v1/generate` and `POST /v1/generate_stream`

### Frontend
- `apps/web/src/components/AiAssistPanel.tsx` — AI assistant panel on planning screens
- `apps/web/src/lib/api.ts` — `apiFetch` helper (JSON-based, not streaming)

---

## Task 1: Add Streaming Method to AiGatewayClient

**Modify:** `apps/core/app/services/ai_gateway_client.rb`

Add a streaming class method alongside the existing `generate`:

```ruby
class AiGatewayClient
  # ... existing code ...

  # Streams tokens from the AI Gateway. Yields each chunk as it arrives.
  # Returns the full accumulated response text.
  def self.generate_stream(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7, &block)
    conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.adapter :net_http
    end

    payload = {
      provider: provider,
      model: model,
      messages: messages,
      task_type: task_type,
      max_tokens: max_tokens,
      temperature: temperature
    }.compact

    full_text = +""

    conn.post("/v1/generate_stream") do |req|
      req.headers["Authorization"] = "Bearer #{SERVICE_TOKEN}"
      req.headers["Content-Type"] = "application/json"
      req.headers["Accept"] = "text/event-stream"
      req.options.timeout = 300
      req.body = payload.to_json

      req.options.on_data = proc do |chunk, _size, _env|
        chunk.each_line do |line|
          line = line.strip
          next if line.empty?
          next unless line.start_with?("data: ")

          data = line.sub("data: ", "")
          next if data == "[DONE]"

          begin
            parsed = JSON.parse(data)
            token = parsed["content"] || parsed["delta"] || parsed["text"] || ""
            unless token.empty?
              full_text << token
              block&.call(token, parsed)
            end
          rescue JSON::ParserError
            # Skip malformed SSE lines
          end
        end
      end
    end

    full_text
  rescue Faraday::Error => e
    raise AiGatewayError.new("Stream request failed: #{e.message}", 502, e.message)
  end
end
```

---

## Task 2: Streaming Controller Endpoint

**Create:** `apps/core/app/controllers/api/v1/ai_stream_controller.rb`

```ruby
class Api::V1::AiStreamController < ApplicationController
  include ActionController::Live

  def create
    task_type = params[:task_type]
    task_policy = AiTaskPolicy.find_by(task_type: task_type)

    unless task_policy&.enabled
      render json: { error: "AI task type '#{task_type}' is not enabled" }, status: :forbidden
      return
    end

    unless task_policy.allowed_roles.blank? || (task_policy.allowed_roles & current_user_roles).any?
      render json: { error: "Your role is not authorized for this task type" }, status: :forbidden
      return
    end

    provider_config = resolve_provider(task_policy)
    model = task_policy.model_override.presence || provider_config.default_model
    messages = build_messages(task_policy)

    invocation = AiInvocation.create!(
      tenant: Current.tenant,
      user: Current.user,
      ai_provider_config: provider_config,
      ai_task_policy: task_policy,
      task_type: task_type,
      provider_name: provider_config.provider_name,
      model: model,
      status: "running",
      started_at: Time.current,
      context: { messages: messages }
    )

    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    token_count = 0
    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    begin
      full_text = AiGatewayClient.generate_stream(
        provider: provider_config.provider_name,
        model: model,
        messages: messages,
        task_type: task_type,
        max_tokens: task_policy.max_tokens_limit || 4096,
        temperature: task_policy.temperature_limit || 0.7
      ) do |token, _parsed|
        token_count += 1
        sse_data = { token: token, invocation_id: invocation.id }.to_json
        response.stream.write("data: #{sse_data}\n\n")
      end

      duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round
      invocation.complete!(tokens: { completion_tokens: token_count }, duration: duration, response_hash: { content: full_text })

      response.stream.write("data: #{({ done: true, invocation_id: invocation.id, content: full_text }).to_json}\n\n")
    rescue AiGatewayClient::AiGatewayError => e
      invocation.fail!(e.message)
      response.stream.write("data: #{({ error: e.message }).to_json}\n\n")
    rescue StandardError => e
      invocation.fail!(e.message)
      response.stream.write("data: #{({ error: "Stream failed" }).to_json}\n\n")
    ensure
      response.stream.close
    end
  end

  private

  def current_user_roles
    Current.user.roles.pluck(:name)
  end

  def resolve_provider(task_policy)
    if task_policy.ai_provider_config_id.present?
      AiProviderConfig.find(task_policy.ai_provider_config_id)
    else
      AiProviderConfig.find_by!(status: "active")
    end
  end

  def build_messages(task_policy)
    msgs = []

    # Load template if specified
    template = task_policy.ai_template
    if template
      msgs << { role: "system", content: template.system_prompt } if template.system_prompt.present?
    end

    # Add user messages from params
    if params[:messages].is_a?(Array)
      msgs += params[:messages].map { |m| m.permit(:role, :content).to_h }
    elsif params[:prompt].present?
      msgs << { role: "user", content: params[:prompt] }
    end

    msgs
  end
end
```

**Add route:**
```ruby
post "ai/stream", to: "ai_stream#create"
```

---

## Task 3: Async AI Job

For long-running tasks (e.g., generating a full unit plan), provide an async path via Sidekiq.

**Create:** `apps/core/app/jobs/ai_generation_job.rb`

```ruby
class AiGenerationJob < ApplicationJob
  queue_as :default

  def perform(invocation_id)
    invocation = AiInvocation.find(invocation_id)
    return if invocation.status == "completed"

    Current.tenant = invocation.tenant

    invocation.update!(status: "running", started_at: Time.current)

    provider_config = invocation.ai_provider_config
    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    result = AiGatewayClient.generate(
      provider: provider_config.provider_name,
      model: invocation.model,
      messages: invocation.context["messages"],
      task_type: invocation.task_type,
      max_tokens: invocation.context["max_tokens"] || 4096,
      temperature: invocation.context["temperature"] || 0.7
    )

    duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round
    tokens = result["usage"] || {}

    invocation.complete!(
      tokens: tokens,
      duration: duration,
      response_hash: result
    )

    # Notify user that generation is complete
    NotificationService.notify(
      user: invocation.user,
      type: "ai_generation_complete",
      title: "AI generation complete: #{invocation.task_type.humanize}",
      message: "Your AI-generated content is ready to review.",
      url: invocation.context["return_url"],
      notifiable: invocation
    )
  rescue AiGatewayClient::AiGatewayError => e
    invocation.fail!(e.message)
  rescue StandardError => e
    invocation.fail!(e.message)
    raise # Re-raise so Sidekiq can retry
  end
end
```

**Add async create option to** `apps/core/app/controllers/api/v1/ai_invocations_controller.rb`:

In the `create` action, check for an `async` parameter. If true, enqueue the job and return the invocation immediately:

```ruby
# Add to the create action, after creating the invocation record:
if params[:async] == true || params[:async] == "true"
  AiGenerationJob.perform_later(invocation.id)
  render json: { invocation_id: invocation.id, status: "pending", message: "Generation queued. Poll GET /api/v1/ai_invocations/#{invocation.id} for status." }, status: :accepted
  return
end
# ... existing synchronous flow continues ...
```

---

## Task 4: Frontend Streaming Support

**Create:** `apps/web/src/lib/api-stream.ts`

```typescript
export async function apiFetchStream(
  path: string,
  body: Record<string, unknown>,
  onToken: (token: string) => void,
  onDone?: (fullText: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    onError?.(text || "Stream request failed");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          onError?.(parsed.error);
          return;
        }
        if (parsed.done) {
          onDone?.(parsed.content || fullText);
          return;
        }
        if (parsed.token) {
          fullText += parsed.token;
          onToken(parsed.token);
        }
      } catch {
        // Skip malformed SSE data
      }
    }
  }

  onDone?.(fullText);
}
```

---

## Task 5: Update AI Assistant Panel for Streaming

**Modify:** `apps/web/src/components/AiAssistPanel.tsx`

**Requirements:**
1. Import `apiFetchStream` from `api-stream.ts`
2. When the user clicks "Generate", use the streaming endpoint instead of the synchronous one:
   - Call `apiFetchStream("/ai/stream", { task_type, prompt, messages }, onToken, onDone, onError)`
3. **Streaming display**:
   - Show a "Generating..." state with a blinking cursor
   - As tokens arrive via `onToken`, append them to a display area in real-time (typewriter effect)
   - Use a `useState` string that grows with each token
4. **Fallback**: if streaming fails (e.g., 403, network error), fall back to the existing synchronous `apiFetch` call to `/api/v1/ai_invocations`
5. **Cancel**: add a "Stop" button during generation that aborts the fetch request via `AbortController`
6. When done, show the "Apply" button as before
7. Keep all existing functionality (task type selector, apply-to-plan, policy banner)

---

## Task 6: Polling for Async Results

**Create:** `apps/web/src/lib/api-poll.ts`

```typescript
export async function pollInvocation(
  invocationId: number,
  onComplete: (result: Record<string, unknown>) => void,
  onError: (error: string) => void,
  intervalMs = 2000,
  maxAttempts = 60
): Promise<void> {
  const { apiFetch } = await import("./api");

  for (let i = 0; i < maxAttempts; i++) {
    const res = await apiFetch(`/ai_invocations/${invocationId}`);
    if (res.status === "completed") {
      onComplete(res);
      return;
    }
    if (res.status === "failed") {
      onError(res.error_message || "Generation failed");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  onError("Generation timed out");
}
```

This is used for the async job path — when the user triggers a long-running generation task, the frontend can poll for completion.

---

## Task 7: Specs

**Create:**
- `apps/core/spec/services/ai_gateway_client_stream_spec.rb`
  - Test `generate_stream` yields tokens from SSE data
  - Test handles `[DONE]` marker
  - Test raises `AiGatewayError` on connection failure

- `apps/core/spec/requests/api/v1/ai_stream_spec.rb`
  - Test `POST /api/v1/ai/stream` with valid task_type returns SSE response
  - Test disabled task_type returns 403
  - Test unauthorized role returns 403
  - Test creates AiInvocation record

- `apps/core/spec/jobs/ai_generation_job_spec.rb`
  - Test job calls AiGatewayClient.generate and marks invocation complete
  - Test job handles AiGatewayError and marks invocation failed
  - Test job creates notification on completion

- `apps/core/spec/requests/api/v1/ai_invocations_async_spec.rb`
  - Test `POST /api/v1/ai_invocations` with `async: true` returns 202 with invocation_id
  - Test invocation is created with "pending" status

---

## Architecture Rules

1. Streaming uses Server-Sent Events (SSE) — `text/event-stream` content type
2. The streaming controller uses `ActionController::Live` for chunked response
3. Each SSE message is JSON: `{ token, invocation_id }` for chunks, `{ done, content }` for completion
4. Async path uses Sidekiq — the job is retryable on unexpected failures
5. The frontend streaming client uses the Fetch API `ReadableStream` — no external libraries
6. Notification integration: async job notifies the user when generation completes
7. Streaming endpoint still creates an `AiInvocation` record for audit tracking
8. `AbortController` on the frontend allows canceling in-flight streams
9. Do NOT remove the existing synchronous path — it remains as a fallback

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/services/ai_gateway_client_stream* spec/requests/api/v1/ai_stream* spec/jobs/ai_generation* spec/requests/api/v1/ai_invocations_async*
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] `AiGatewayClient.generate_stream` method with SSE parsing and block yield
- [ ] Streaming controller at `POST /api/v1/ai/stream` with SSE response
- [ ] `AiGenerationJob` for async generation via Sidekiq
- [ ] Async option on `ai_invocations#create` endpoint
- [ ] `apiFetchStream` frontend utility for SSE consumption
- [ ] `pollInvocation` frontend utility for async polling
- [ ] AI Assistant Panel updated with streaming display, cancel button, fallback
- [ ] Specs for streaming client, controller, job, and async invocations
- [ ] All lint and build checks pass
