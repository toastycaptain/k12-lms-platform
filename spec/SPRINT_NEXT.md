# Next Sprint Priorities

Items that improve security coverage, test confidence, observability, and developer workflow.

---

## 5. Extend rate limiting to auth and core API endpoints

**File:** `apps/core/config/initializers/rack_attack.rb`

**Current state** (5 lines — only throttles the addon endpoint):

```ruby
class Rack::Attack
  throttle("addon/ip", limit: 60, period: 60) do |req|
    req.ip if req.path.start_with?("/api/v1/addon")
  end
end
```

**Add at minimum:**

1. **Auth endpoint throttle** — Prevent credential-stuffing on login:
   ```ruby
   throttle("auth/ip", limit: 10, period: 60) do |req|
     req.ip if req.path.start_with?("/auth") && req.post?
   end
   ```

2. **General API throttle** — Prevent DoS on all API endpoints:
   ```ruby
   throttle("api/ip", limit: 300, period: 60) do |req|
     req.ip if req.path.start_with?("/api/")
   end
   ```

3. **Custom response** — Return 429 with a JSON body and `Retry-After` header so API clients can back off gracefully:
   ```ruby
   Rack::Attack.throttled_responder = lambda do |req|
     [429, { "Content-Type" => "application/json", "Retry-After" => "60" },
      ['{"error":"Rate limit exceeded. Try again later."}']]
   end
   ```

4. **Blocklist/safelist** — Consider safelisting health-check paths (`/up`) and internal service IPs.

---

## 6. Add integration/request specs for Rails API controllers

**Current state:** `apps/core/spec/requests/` exists but is empty. There are 37+ API controllers with zero request-level test coverage. Only model specs (55+) and policy specs exist.

**Approach:**
- Create request specs for the highest-risk controllers first:
  1. `sessions_controller` — auth flow (login, logout, session handling)
  2. `courses_controller` — core CRUD + publish/archive actions
  3. `assignments_controller` — CRUD + publish + close + push_to_classroom
  4. `submissions_controller` — CRUD + grade action
  5. `quizzes_controller` + `quiz_attempts_controller` — assessment flow
  6. `addon_controller` — external-facing, JWT-authenticated

**Each spec should verify:**
- Correct HTTP status codes for success and failure cases
- JSON response shape matches serializer output
- Authentication enforcement (401 when unauthenticated)
- Authorization enforcement (403 for wrong role)
- Tenant isolation (cannot access another tenant's records)
- Parameter validation (422 for bad input)

**Setup:** Request specs need session/cookie handling since the app uses session-based auth. Use `ActionDispatch::IntegrationTest` conventions or configure RSpec request specs to support session injection.

---

## 7. Set up frontend testing

**Current state:** `apps/web/` has zero test files. No test runner is installed.

**Steps:**

1. **Install Vitest + React Testing Library + jsdom:**
   ```
   npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
   ```

2. **Create `apps/web/vitest.config.ts`** with React + jsdom environment.

3. **Add test scripts to `apps/web/package.json`:**
   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:coverage": "vitest run --coverage"
   ```

4. **Add `test` step to CI** — In `.github/workflows/ci.yml`, add `npm test` to the `web` job after the build step.

5. **Write initial tests for critical paths:**
   - `src/lib/api.ts` — Unit test `apiFetch`: successful responses, error responses, 401 handling
   - `src/lib/auth-context.tsx` — Test auth provider: loading state, authenticated state, unauthenticated redirect
   - `src/components/ProtectedRoute.tsx` — Test redirect when unauthenticated
   - `src/app/dashboard/page.tsx` — Integration test: renders with mocked API data

---

## 8. Add error tracking (Sentry) to all three services

**Why:** There is currently no error tracking in any service. Production errors go to stdout logs only.

### Rails Core (`apps/core`)

1. Add `gem "sentry-ruby"` and `gem "sentry-rails"` to `Gemfile`
2. Create `config/initializers/sentry.rb`:
   ```ruby
   Sentry.init do |config|
     config.dsn = ENV["SENTRY_DSN"]
     config.environment = Rails.env
     config.breadcrumbs_logger = [:active_support_logger, :http_logger]
     config.traces_sample_rate = ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", 0.1).to_f
     config.send_default_pii = false  # FERPA — do not send PII
   end
   ```
3. Add `SENTRY_DSN` to `.env.example`
4. Sentry-rails automatically captures unhandled exceptions and integrates with Active Job for background job errors.

### AI Gateway (`apps/ai-gateway`)

1. Add `sentry-sdk[fastapi]` to `pyproject.toml` dependencies
2. Initialize in `app/main.py`:
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.ai_gateway_env, traces_sample_rate=0.1)
   ```
3. Add `sentry_dsn: str = ""` to `app/config.py` `Settings` class
4. Add `SENTRY_DSN` to `.env.example`

### Next.js Web (`apps/web`)

1. Install `@sentry/nextjs`
2. Run the Sentry wizard or manually configure `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`
3. Wrap `next.config.ts` with `withSentryConfig`
4. Add `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to `.env.example`

---

## 9. Extend Dependabot to npm and pip ecosystems

**File:** The root-level `.github/dependabot.yml` does not exist — there is only `apps/core/.github/dependabot.yml` covering `bundler` and `github-actions`.

**Create `/Users/colinpeterson/k12-lms-platform/.github/dependabot.yml`** at the repo root (Dependabot reads from the repo root's `.github/` directory):

```yaml
version: 2
updates:
  # Ruby gems (Rails core)
  - package-ecosystem: bundler
    directory: "/apps/core"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  # npm packages (Next.js web)
  - package-ecosystem: npm
    directory: "/apps/web"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  # pip packages (AI Gateway)
  - package-ecosystem: pip
    directory: "/apps/ai-gateway"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  # GitHub Actions
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5

  # Docker base images
  - package-ecosystem: docker
    directory: "/apps/core"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

Then remove the now-redundant `apps/core/.github/dependabot.yml`.

---

## 10. Add Python linting and type-checking to CI

**Current state:** The AI Gateway has no linting, formatting, or static type checking. The CI job only runs `pytest`.

**Steps:**

1. **Add dev dependencies** to `apps/ai-gateway/pyproject.toml`:
   ```toml
   dev = [
     "pytest>=8.3,<10.0",
     "pytest-asyncio>=0.24,<1.0",
     "ruff>=0.9,<1.0",
     "mypy>=1.14,<2.0",
   ]
   ```

2. **Add tool configuration** to `pyproject.toml`:
   ```toml
   [tool.ruff]
   line-length = 100
   target-version = "py311"

   [tool.ruff.lint]
   select = ["E", "F", "I", "W", "UP", "B", "SIM"]

   [tool.mypy]
   python_version = "3.11"
   strict = true
   plugins = ["pydantic.mypy"]
   ```

3. **Update CI** — In `.github/workflows/ci.yml`, update the `ai_gateway` job:
   ```yaml
   - name: Lint
     run: ruff check .
   - name: Format check
     run: ruff format --check .
   - name: Type check
     run: mypy app/
   - name: Run tests
     run: pytest
   ```

4. **Fix any existing violations** surfaced by ruff and mypy before merging.
