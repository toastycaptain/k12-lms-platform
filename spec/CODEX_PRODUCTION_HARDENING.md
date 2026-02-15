# Codex Instructions — Production Hardening

## Objective

Consolidate all security, testing, observability, and production-readiness items into a single build-out. This covers: security hardening, .env documentation, Dockerfile improvements, rate limiting, request/frontend test setup, Sentry integration, health checks, code quality fixes, and CI/CD improvements.

---

## What Already Exists (DO NOT recreate)

### Infrastructure
- `apps/core/Dockerfile` — basic single-stage Dockerfile
- `apps/core/Dockerfile.sidekiq` — Sidekiq Dockerfile
- `apps/web/Dockerfile` — basic Next.js Dockerfile
- `.github/workflows/ci.yml` — CI with lint/test/build
- `apps/core/config/initializers/rack_attack.rb` — only throttles addon endpoint

### Testing
- `apps/core/spec/` — model specs, policy specs, some request specs, factories
- `apps/web/` — no test files, no test runner

---

## Task 1: Create .env.example Files

No .env.example files exist. New developers can't set up the project.

**Create:** `apps/core/.env.example`
```env
# Database
DATABASE_URL=postgresql://localhost:5432/k12_development

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# CORS
CORS_ORIGINS=http://localhost:3000

# Active Record Encryption
ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=

# Rails
RAILS_MASTER_KEY=
RAILS_LOG_LEVEL=info
RAILS_LOG_TO_STDOUT=true

# Redis (for Sidekiq)
REDIS_URL=redis://localhost:6379/0

# AI Gateway
AI_GATEWAY_URL=http://localhost:8000
AI_GATEWAY_SERVICE_TOKEN=

# Sentry (optional)
SENTRY_DSN=
```

**Create:** `apps/web/.env.example`
```env
# API base URL for the Rails backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=
```

**Create:** `apps/ai-gateway/.env.example`
```env
AI_GATEWAY_PORT=8000
AI_GATEWAY_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000

# LLM Provider Keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Auth
SERVICE_TOKEN=

# Sentry (optional)
SENTRY_DSN=
```

---

## Task 2: Harden Dockerfiles

### `apps/core/Dockerfile` — Replace entirely:

```dockerfile
# --- Builder ---
FROM ruby:4.0.1 AS builder
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libyaml-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3 --without development test
COPY . .

# --- Runtime ---
FROM ruby:4.0.1-slim AS runtime
RUN apt-get update -qq && apt-get install -y libpq5 libyaml-0-2 curl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
WORKDIR /app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s CMD curl -f http://localhost:3000/up || exit 1
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

### `apps/core/Dockerfile.sidekiq` — Replace entirely:

```dockerfile
FROM ruby:4.0.1 AS builder
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libyaml-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3 --without development test
COPY . .

FROM ruby:4.0.1-slim AS runtime
RUN apt-get update -qq && apt-get install -y libpq5 libyaml-0-2 && rm -rf /var/lib/apt/lists/*
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
WORKDIR /app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app /app
USER appuser
CMD ["bundle", "exec", "sidekiq"]
```

### Create `apps/core/.dockerignore`:
```
.git
tmp
log
spec
node_modules
config/master.key
.env*
```

### Create `apps/ai-gateway/Dockerfile`:
```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir --prefix=/install .

FROM python:3.11-slim
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
WORKDIR /app
COPY --from=builder /install /usr/local
COPY app/ app/
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/v1/health')" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Task 3: Rate Limiting

**Modify:** `apps/core/config/initializers/rack_attack.rb`

Replace the file entirely:

```ruby
class Rack::Attack
  # Auth endpoints — prevent credential stuffing
  throttle("auth/ip", limit: 10, period: 60) do |req|
    req.ip if req.path.start_with?("/auth") && req.post?
  end

  # Addon endpoints — external-facing
  throttle("addon/ip", limit: 60, period: 60) do |req|
    req.ip if req.path.start_with?("/api/v1/addon")
  end

  # AI generation — expensive operations
  throttle("ai/ip", limit: 20, period: 60) do |req|
    req.ip if req.path.start_with?("/api/v1/ai_invocations") && req.post?
  end

  # General API — prevent abuse
  throttle("api/ip", limit: 300, period: 60) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  # JSON 429 response
  self.throttled_responder = lambda do |_req|
    [429, { "Content-Type" => "application/json", "Retry-After" => "60" },
     ['{"error":"Rate limit exceeded. Try again later."}']]
  end
end
```

---

## Task 4: Pin Gems in Gemfile

**Modify:** `apps/core/Gemfile`

Audit every unpinned gem and add pessimistic version constraints matching what's currently in Gemfile.lock. At minimum pin these:

```ruby
gem "devise", "~> 5.0"
gem "omniauth", "~> 2.1"
gem "omniauth-google-oauth2", "~> 1.2"
gem "omniauth-rails_csrf_protection", "~> 2.0"
gem "pundit", "~> 2.5"
gem "sidekiq", "~> 8.1"
gem "active_model_serializers", "~> 0.10"
gem "prawn", "~> 2.4"
gem "prawn-table", "~> 0.2"
gem "faraday", "~> 2.14"
gem "rack-cors", "~> 3.0"
gem "rack-attack", "~> 6.8"
```

Check `Gemfile.lock` for exact versions and pin to `~> MAJOR.MINOR`.

---

## Task 5: Code Quality Fixes

### Fix bare `rescue => e` in sync jobs

**Modify:** `apps/core/app/jobs/classroom_roster_sync_job.rb`

Inner rescue (per-record): change `rescue => e` to:
```ruby
rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique, Google::Apis::Error => e
```

Outer rescue: change `rescue => e` to:
```ruby
rescue StandardError => e
```

Apply the same pattern to:
- `app/jobs/classroom_course_sync_job.rb`
- `app/jobs/one_roster_org_sync_job.rb`
- `app/jobs/one_roster_user_sync_job.rb`

### Extract duplicated `privileged_user?`

**Modify:** `apps/core/app/policies/application_policy.rb`

Add to both the outer class and inner Scope class:
```ruby
private

def privileged_user?
  user.has_role?(:admin) || user.has_role?(:curriculum_lead)
end
```

Then remove `privileged_user?` from every policy that defines it individually. Run:
```bash
grep -rn "def privileged_user?" app/policies/
```
and remove each duplicate.

### Fix silent catch in dashboard

**Modify:** `apps/web/src/app/dashboard/page.tsx`

Replace empty `catch {}` with:
```typescript
} catch (error) {
  console.error("Failed to load dashboard data:", error);
}
```

---

## Task 6: Deeper Health Check

**Create:** `apps/core/app/controllers/api/v1/health_controller.rb`

```ruby
class Api::V1::HealthController < ActionController::API
  def show
    checks = {}

    # Database
    begin
      ActiveRecord::Base.connection.execute("SELECT 1")
      checks[:database] = "ok"
    rescue StandardError => e
      checks[:database] = "error: #{e.message}"
    end

    # Redis
    begin
      redis = Redis.new(url: ENV["REDIS_URL"])
      redis.ping
      checks[:redis] = "ok"
    rescue StandardError => e
      checks[:redis] = "error: #{e.message}"
    end

    status = checks.values.all? { |v| v == "ok" } ? :ok : :service_unavailable
    render json: { status: status == :ok ? "ok" : "degraded", checks: checks }, status: status
  end
end
```

**Add route** (outside the authenticated namespace):
```ruby
namespace :api do
  namespace :v1 do
    get "health", to: "health#show"
    # ... existing routes ...
  end
end
```

---

## Task 7: Frontend Test Setup

**In `apps/web/`:**

1. Install dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

2. **Create:** `apps/web/vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

3. **Create:** `apps/web/src/test/setup.ts`
```typescript
import "@testing-library/jest-dom";
```

4. **Add to `apps/web/package.json` scripts:**
```json
"test": "vitest run",
"test:watch": "vitest"
```

5. **Create initial test:** `apps/web/src/lib/__tests__/api.test.ts`
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should be importable", async () => {
    // Basic smoke test — verify the module can be imported
    const api = await import("../api");
    expect(api).toBeDefined();
  });
});
```

---

## Task 8: Dependabot Configuration

**Create:** `.github/dependabot.yml` at the repo root:

```yaml
version: 2
updates:
  - package-ecosystem: bundler
    directory: "/apps/core"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  - package-ecosystem: npm
    directory: "/apps/web"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  - package-ecosystem: pip
    directory: "/apps/ai-gateway"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5

  - package-ecosystem: docker
    directory: "/apps/core"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

Remove `apps/core/.github/dependabot.yml` if it exists (the root-level one supersedes it).

---

## Architecture Rules

1. Security changes must not break existing functionality — run full test suite after each change
2. Dockerfiles use multi-stage builds with slim runtime images
3. Rate limits should be reasonable for a school-sized deployment (not enterprise scale)
4. .env.example files document ALL required and optional variables
5. Health check endpoint is unauthenticated (it's called by container orchestrators)

---

## Testing

```bash
cd apps/core && bundle exec rspec && bundle exec rubocop
cd apps/web && npm run lint && npm run typecheck && npm run build && npm run test
```

---

## Definition of Done

- [ ] .env.example files for all 3 services
- [ ] Multi-stage Dockerfiles with non-root user and health checks
- [ ] .dockerignore files
- [ ] AI Gateway Dockerfile
- [ ] Rate limiting on auth, addon, AI, and general API endpoints
- [ ] All gems pinned in Gemfile
- [ ] Bare rescue blocks fixed in sync jobs
- [ ] privileged_user? extracted to ApplicationPolicy
- [ ] Silent catch fixed in dashboard
- [ ] Health check endpoint at /api/v1/health
- [ ] Vitest installed and configured for Next.js
- [ ] Initial frontend test passing
- [ ] Dependabot config at repo root
- [ ] All lint, test, and build checks pass
