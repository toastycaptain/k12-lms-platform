# Codex Task: Close Remaining Coverage Gaps

## Overview

The project is at 95% coverage. This task closes the last gaps:
- 3 missing service specs
- 1 missing model spec
- 2 frontend stub pages to flesh out

**Rules:**
- Every spec uses `require "rails_helper"` at the top.
- Every spec sets `Current.tenant` in `before` and clears in `after`.
- Service specs mock external HTTP calls (Faraday, Net::HTTP) — never hit real endpoints.
- Follow the existing patterns in `spec/services/` exactly.
- Run `bundle exec rspec` after all files are created — every spec must pass.
- For frontend pages, use the same component patterns as existing pages (`"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`).

---

## Existing Service Spec Pattern

```ruby
# spec/services/google_token_service_spec.rb (abbreviated)
require "rails_helper"

RSpec.describe GoogleTokenService do
  let(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant,
      google_access_token: "valid-access-token",
      google_refresh_token: "valid-refresh-token",
      google_token_expires_at: 10.minutes.from_now)
    Current.tenant = nil
    user
  end
  let(:service) { described_class.new(user) }
  after { Current.tenant = nil }

  describe "#valid_token?" do
    it "returns true when the token exists and is not expired" do
      expect(service.valid_token?).to be true
    end
  end

  describe "#refresh!" do
    it "refreshes the token via Google OAuth endpoint" do
      user.update!(google_token_expires_at: 1.minute.ago)
      response_body = { "access_token" => "new-token", "expires_in" => 3600 }.to_json
      stub_request = instance_double(Net::HTTPOK, body: response_body)
      allow(Net::HTTP).to receive(:post_form).and_return(stub_request)

      service.refresh!
      expect(user.reload.google_access_token).to eq("new-token")
    end
  end
end
```

---

## Task 1: Add Service Spec for AuditLogger

### File: `spec/services/audit_logger_spec.rb`

The `AuditLogger` is a class-method-only service (`AuditLogger.log(...)`). Here is the source:

```ruby
class AuditLogger
  class << self
    def log(event_type:, actor: nil, auditable: nil, metadata: {}, request: nil)
      return if Current.tenant.blank?

      AuditLog.create!(
        tenant: Current.tenant,
        actor: actor || Current.user,
        auditable: auditable,
        event_type: event_type,
        request_id: request&.request_id,
        ip_address: request&.remote_ip,
        user_agent: request&.user_agent,
        metadata: normalize_metadata(metadata)
      )
    rescue StandardError => e
      Rails.logger.error("audit_log_failed event_type=#{event_type} error=#{e.class}: #{e.message}")
      nil
    end

    private

    def normalize_metadata(metadata)
      return {} if metadata.nil?
      return metadata.to_unsafe_h if metadata.respond_to?(:to_unsafe_h)
      return metadata.to_h if metadata.respond_to?(:to_h)
      { value: metadata.to_s }
    end
  end
end
```

**Tests to write:**

1. `AuditLogger.log` creates an AuditLog record with correct attributes when Current.tenant is set.
2. Uses `Current.user` as actor when no actor is explicitly passed.
3. Uses the explicit actor when one is passed.
4. Returns nil and does NOT create a record when `Current.tenant` is blank.
5. Captures `request_id`, `ip_address`, `user_agent` from a request object when provided.
6. Handles nil metadata gracefully (normalizes to `{}`).
7. Does not raise on StandardError — logs error and returns nil.
8. Handles ActionController::Parameters metadata via `to_unsafe_h`.

**Setup notes:**
- Set `Current.tenant` and `Current.user` in before block.
- For the request object, use a double: `instance_double(ActionDispatch::Request, request_id: "req-123", remote_ip: "127.0.0.1", user_agent: "TestAgent")`.
- For ActionController::Parameters test, use `ActionController::Parameters.new(key: "value")`.

---

## Task 2: Add Service Spec for OneRosterClient

### File: `spec/services/one_roster_client_spec.rb`

The `OneRosterClient` uses Faraday to communicate with a OneRoster v1p1 API. It authenticates via client_credentials OAuth, caches the token in Rails.cache, and paginates results.

**Tests to write:**

1. `#get_all_orgs` — returns parsed org records from the API.
2. `#get_all_users` — returns parsed user records.
3. `#get_all_classes` — returns parsed class records.
4. `#get_all_enrollments` — returns parsed enrollment records.
5. `#get_all_academic_sessions` — returns parsed academic session records.
6. Authentication: `#authenticate!` posts client_credentials to `/token` and caches the access_token.
7. Authentication failure: raises `OneRosterClient::OneRosterError` with status_code when `/token` returns non-success.
8. Token caching: uses cached token on second request instead of re-authenticating.
9. Auto-retry on 401: when an API call returns 401, re-authenticates and retries once.
10. Pagination: when a batch returns `limit` records, fetches next page; stops when batch < limit.
11. API error: raises `OneRosterClient::OneRosterError` with status_code and response_body on non-success response.

**Setup notes:**
- Create the client: `described_class.new(base_url: "https://oneroster.example.com", client_id: "id", client_secret: "secret")`
- Stub Faraday connections. The client creates TWO Faraday connections internally (`@conn` for API calls, `@token_conn` for auth). The simplest approach is to stub at the Faraday response level:
  ```ruby
  let(:token_response) { instance_double(Faraday::Response, success?: true, status: 200, body: { "access_token" => "tok-123", "expires_in" => 3600 }) }
  let(:api_response) { instance_double(Faraday::Response, success?: true, status: 200, body: { "orgs" => [{ "sourcedId" => "org-1" }] }, headers: {}) }
  ```
- Use `allow_any_instance_of(Faraday::Connection)` or stub the connection objects before they're created. A cleaner approach: stub `Faraday.new` to return test doubles, or use `allow(...).to receive(:post)` / `allow(...).to receive(:get)` on the connection instances.
- Clear `Rails.cache` in `before` block to ensure clean token state.

---

## Task 3: Add Service Spec for AiGatewayClient

### File: `spec/services/ai_gateway_client_spec.rb`

The `AiGatewayClient` is a class-method-only service (`AiGatewayClient.generate(...)`). It uses Faraday to POST to the AI Gateway.

Here is the source:

```ruby
class AiGatewayClient
  BASE_URL = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
  SERVICE_TOKEN = ENV.fetch("AI_GATEWAY_SERVICE_TOKEN", "")

  class AiGatewayError < StandardError
    attr_reader :status_code, :response_body
    def initialize(message, status_code: nil, response_body: nil)
      @status_code = status_code
      @response_body = response_body
      super(message)
    end
  end

  def self.generate(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7)
    conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.response :json
      f.options.timeout = 120
    end

    response = conn.post("/v1/generate") do |req|
      req.headers["Authorization"] = "Bearer #{SERVICE_TOKEN}"
      req.body = {
        provider: provider, model: model, messages: messages,
        task_type: task_type, max_tokens: max_tokens, temperature: temperature
      }.compact
    end

    unless response.success?
      raise AiGatewayError.new(
        "AI Gateway error: #{response.status}",
        status_code: response.status,
        response_body: response.body
      )
    end

    response.body
  end
end
```

**Tests to write:**

1. `.generate` returns the parsed response body on success.
2. Sends correct payload (provider, model, messages, task_type, max_tokens, temperature) to `/v1/generate`.
3. Sends Authorization header with Bearer token.
4. Omits nil fields from payload (e.g., task_type: nil is compacted out).
5. Raises `AiGatewayClient::AiGatewayError` with status_code and response_body on non-success response.
6. The error includes the HTTP status code in the message.

**Setup notes:**
- Stub the Faraday connection. The cleanest approach: let Faraday build normally but stub the adapter. Or use `allow_any_instance_of(Faraday::Connection).to receive(:post).and_return(...)`.
- Use `stub_const("AiGatewayClient::BASE_URL", "http://localhost:8000")` if needed.
- Create response doubles:
  ```ruby
  let(:success_response) { instance_double(Faraday::Response, success?: true, status: 200, body: { "content" => "Hello!" }) }
  let(:error_response) { instance_double(Faraday::Response, success?: false, status: 500, body: { "error" => "Internal error" }) }
  ```

---

## Task 4: Add Model Spec for LessonVersion

### File: `spec/models/lesson_version_spec.rb`

The `LessonVersion` model:

```ruby
class LessonVersion < ApplicationRecord
  include TenantScoped

  belongs_to :lesson_plan
  has_many :resource_links, as: :linkable, dependent: :destroy

  validates :version_number, presence: true, uniqueness: { scope: :lesson_plan_id }
  validates :title, presence: true
end
```

**Tests to write:**

1. Associations: `belong_to(:tenant)`, `belong_to(:lesson_plan)`, `have_many(:resource_links).dependent(:destroy)`.
2. Validations: `validate_presence_of(:version_number)`, `validate_presence_of(:title)`, `validate_presence_of(:tenant_id)`.
3. Uniqueness: version_number must be unique within lesson_plan scope.
4. Tenant scoping: two-tenant isolation test.

**Setup notes:**
- You'll need to create a lesson_plan (which requires a course, which requires an academic_year): `create(:lesson_plan, tenant: tenant)`.
- For the uniqueness test: create two lesson_versions with the same version_number on different lesson_plans (should work), then try same version_number on same lesson_plan (should fail).

---

## Task 5: Flesh Out Frontend Stub Pages

### 5a. File: `apps/web/src/app/communicate/page.tsx`

Replace the stub with a functional announcements/messaging page. This page should:

1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`, `useAuth`.
2. Fetch announcements from `GET /api/v1/announcements`.
3. Display a list of announcements with title, message preview, and created_at date.
4. Allow admin/teacher users to create a new announcement via a simple form (title + message textarea).
5. POST to `/api/v1/announcements` with `{ announcement: { title, message, course_id } }`.
6. Include a course selector dropdown that fetches from `GET /api/v1/courses`.
7. Show error/success feedback banners (same pattern as other admin pages).
8. If no announcements exist, show "No announcements yet."

### 5b. File: `apps/web/src/app/report/page.tsx`

Replace the stub with a basic reporting dashboard. This page should:

1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`, `useAuth`.
2. Show summary cards with counts fetched from the API:
   - Total courses: `GET /api/v1/courses` → `.length`
   - Total students: `GET /api/v1/users?role=student` → `.length` (if the users endpoint supports role filter)
   - Total assignments: `GET /api/v1/assignments` → `.length`
   - Total quizzes: `GET /api/v1/quizzes` → `.length`
3. Display the cards in a responsive grid (2 columns on mobile, 4 on desktop).
4. Each card shows the count with a label and a subtle icon or colored accent.
5. Below the cards, show a "Recent Submissions" section that fetches `GET /api/v1/submissions` and shows the 10 most recent with assignment name, student info (if available), status badge, and submitted_at date.
6. Handle loading and error states.
7. Restrict to admin/curriculum_lead/teacher roles (check `user?.roles`).

---

## Task 6: Verify

After creating ALL files from Tasks 1-5, run:

```bash
bundle exec rspec
```

Every single spec must pass. If any spec fails:
1. Read the actual source file to understand the real behavior.
2. Fix the spec to match reality — do NOT modify application code.
3. Re-run until green.

For the frontend, run:

```bash
cd apps/web && npm run build
```

The build must succeed with 0 errors.

**Expected results:**
- Rails: total examples should increase from ~1093 to ~1120+ with 0 failures.
- Next.js: 53 routes, 0 errors, no stubs remaining.
