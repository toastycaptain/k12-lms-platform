# Codex Instructions — AI Product Integration

## Objective

Wire the AI gateway into the product as a fully functional, policy-enforced, auditable feature. Currently the gateway works standalone but the Rails ↔ Gateway ↔ Frontend flow is not end-to-end verified, policy settings from admin UI don't enforce, and invocation persistence is incomplete.

**Spec references:** PRD-14 (AI Gateway), UX-3.7 (AI Assistant Panel), TECH-2.10 (AI Gateway Contract)

---

## What Already Exists (DO NOT recreate)

### AI Gateway (apps/ai-gateway/)
- `app/routers/v1.py` — POST /v1/generate, POST /v1/generate_stream, GET /v1/providers, GET /v1/health
- `app/providers/` — OpenAI + Anthropic providers with streaming
- `app/safety/filters.py` — Basic regex-based input/output safety
- `app/prompts/system_prompts.py` — System prompts for lesson_generation, unit_generation, differentiation, assessment_generation, rewrite
- `app/auth.py` — Bearer token verification
- Full test suite (49+ tests)

### Rails Backend (apps/core/)
- `app/models/ai_provider_config.rb` — provider_name, default_model, api_key, status, available_models, settings
- `app/models/ai_task_policy.rb` — task_type, enabled, requires_approval, allowed_roles, model_override, temperature_limit, max_tokens_limit
- `app/models/ai_template.rb` — name, task_type, system_prompt, user_prompt_template, variables
- `app/models/ai_invocation.rb` — task_type, provider_name, model, status, tokens, duration, context, error_message
- `app/controllers/api/v1/ai_provider_configs_controller.rb` — full CRUD + activate/deactivate
- `app/controllers/api/v1/ai_task_policies_controller.rb` — full CRUD
- `app/controllers/api/v1/ai_templates_controller.rb` — full CRUD
- `app/controllers/api/v1/ai_invocations_controller.rb` — index, show, create
- `app/controllers/api/v1/ai_stream_controller.rb` — create (SSE streaming)
- `app/services/ai_gateway_client.rb` — HTTP client for gateway
- `app/jobs/ai_generation_job.rb` — async generation via Sidekiq

### Frontend (apps/web/)
- `src/components/AiAssistPanel.tsx` — AI assistant sidebar on planner screens
- `src/lib/api-stream.ts` — `apiFetchStream()` for SSE
- `src/lib/api-poll.ts` — `pollInvocation()` for async fallback
- `src/app/admin/ai/page.tsx` — provider config management
- `src/app/admin/ai/policies/page.tsx` — task policy toggles
- `src/app/admin/ai/templates/page.tsx` — template management

---

## Task 1: Policy Enforcement in AiStreamController

**File:** `apps/core/app/controllers/api/v1/ai_stream_controller.rb`

**Current state:** The controller creates an AI invocation and streams from the gateway, but it does not check AiTaskPolicy before generating.

**Required changes:**
1. Before calling the gateway, look up the AiTaskPolicy for the requested `task_type`:
   ```ruby
   policy = AiTaskPolicy.find_by(task_type: params[:task_type], enabled: true)
   ```
2. If no enabled policy exists for the task_type → return 403 with `{ error: "AI task type not enabled" }`
3. If policy has `allowed_roles` → verify `Current.user` has one of those roles; return 403 if not
4. If policy has `requires_approval` → return 403 with `{ error: "This AI action requires approval" }` (approval workflow is future scope)
5. If policy has `model_override` → use it instead of the requested model
6. If policy has `temperature_limit` → cap the temperature at that limit
7. If policy has `max_tokens_limit` → cap max_tokens at that limit
8. Pass the resolved provider/model/constraints to the gateway client

**Test:** `apps/core/spec/requests/api/v1/ai_stream_spec.rb`
- Test that streaming works when policy is enabled for user's role
- Test that streaming returns 403 when policy is disabled
- Test that streaming returns 403 when user's role is not in allowed_roles
- Test that model_override from policy is used instead of user-requested model

---

## Task 2: Policy Enforcement in AiInvocationsController

**File:** `apps/core/app/controllers/api/v1/ai_invocations_controller.rb`

**Required changes:** Same policy enforcement as Task 1, applied to the `create` action (async generation path).

1. Look up AiTaskPolicy for the requested task_type
2. Enforce enabled, allowed_roles, requires_approval checks
3. Apply model_override, temperature_limit, max_tokens_limit from policy
4. Record the `ai_task_policy_id` on the created AiInvocation

---

## Task 3: Invocation Lifecycle Completion

**File:** `apps/core/app/services/ai_gateway_client.rb`

**Verify and fix the full lifecycle:**
1. `create` action in controller creates AiInvocation with status "pending"
2. AiGenerationJob runs the gateway call and updates the invocation:
   - On success: `invocation.complete!(tokens: usage, duration: elapsed_ms, response_hash: response)`
   - On failure: `invocation.fail!(error_message)`
3. The invocation record should have accurate `prompt_tokens`, `completion_tokens`, `total_tokens`, `duration_ms`

**For streaming (AiStreamController):**
1. Create AiInvocation with status "running" at stream start
2. Accumulate token counts from stream chunks
3. On stream completion: `invocation.complete!(tokens: accumulated, duration: elapsed)`
4. On stream error: `invocation.fail!(error_message)`

**Test:** `apps/core/spec/services/ai_gateway_client_spec.rb`
- Verify invocation transitions through pending → running → completed
- Verify token counts are recorded accurately
- Verify failed invocations record error messages

---

## Task 4: Admin AI Config → Gateway Provider Selection

**Problem:** Admin configures providers at `/admin/ai`, but the gateway independently selects providers based on the request's `provider` field. The Rails-managed config should drive which provider and model the gateway uses.

**Required changes in AiStreamController and AiInvocationsController:**
1. Look up the active AiProviderConfig for the tenant
2. Use the config's `provider_name` and `default_model` (or policy's `model_override`) when calling the gateway
3. Pass the config's `api_key` if the gateway expects per-tenant keys (check the gateway's auth model)
4. If no active provider config exists → return 503 with `{ error: "No AI provider configured" }`

**Frontend update in AiAssistPanel:**
1. Before showing the AI panel, fetch `/api/v1/ai_provider_configs` to check if any provider is active
2. If no active provider → show a disabled state: "AI is not configured. Contact your administrator."
3. Fetch `/api/v1/ai_task_policies` to determine which task types are available
4. Only show task type buttons for enabled policies that the user's role is allowed to use

---

## Task 5: AI Assistant "Apply to Plan" Action

**File:** `apps/web/src/components/AiAssistPanel.tsx`

**Current state:** AI output streams into the panel but the teacher must manually copy it.

**Required changes:**
1. Add an "Apply" button below the AI output
2. The panel should accept an `onApply` callback prop: `onApply?: (content: string) => void`
3. When "Apply" is clicked, call `onApply` with the generated content
4. Each host page (Unit Planner, Lesson Editor, Template Editor) passes an `onApply` handler that inserts the content into the appropriate field:
   - Unit Planner: insert into description or essential_questions depending on task_type
   - Lesson Editor: insert into activities or objectives depending on task_type
   - Template Editor: insert into description or enduring_understandings

**Update these pages:**
- `apps/web/src/app/plan/units/[id]/page.tsx` — add `onApply` handler
- `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` — add `onApply` handler
- `apps/web/src/app/plan/templates/[id]/page.tsx` — add `onApply` handler

---

## Task 6: Policy Banner in AI Panel

**File:** `apps/web/src/components/AiAssistPanel.tsx`

**Required changes (per UX spec §3.7):**
1. At the top of the AI panel, show a policy banner:
   - If policies are loaded and enabled: "AI actions are governed by your school's policy."
   - If policies restrict certain task types: gray out unavailable task type buttons
2. Style: subtle info banner (light blue background, small text)

---

## Architecture Rules

1. The AI gateway remains stateless — it does not read Rails database
2. Policy enforcement happens in Rails, not in the gateway
3. The gateway's bearer token is a service-to-service secret (AI_GATEWAY_TOKEN env var)
4. All AI invocations MUST be persisted for audit trail
5. Token usage MUST be recorded for cost tracking
6. Never expose the gateway's bearer token to the frontend

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/requests/api/v1/ai_stream_spec.rb spec/requests/api/v1/ai_invocations_spec.rb spec/services/ai_gateway_client_spec.rb
cd apps/web && npm run typecheck && npm run build && npm run test
```

---

## Definition of Done

- [ ] AiStreamController enforces AiTaskPolicy (enabled, allowed_roles, model_override, limits)
- [ ] AiInvocationsController enforces AiTaskPolicy
- [ ] AI invocations persist full lifecycle (pending → running → completed/failed)
- [ ] Token counts (prompt, completion, total) and duration recorded accurately
- [ ] Admin provider config drives gateway provider/model selection
- [ ] AiAssistPanel checks provider + policy availability before rendering
- [ ] "Apply to Plan" button inserts AI output into editor fields
- [ ] Policy banner displayed in AI panel
- [ ] Request specs cover policy enforcement (enabled/disabled, role-based, model override)
- [ ] All existing tests still pass
