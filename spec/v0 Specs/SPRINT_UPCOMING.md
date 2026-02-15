# Upcoming Sprint Priorities

Items that harden production readiness, improve observability, and close remaining gaps.

---

## 11. Build a proper CD pipeline (staging → prod with gates)

**Current state:** `.github/workflows/ci.yml` only runs lint/test/build. There is no deployment automation. Kamal is configured (`apps/core/config/deploy.yml`) but has no CI integration and all deployment hooks are sample files only.

**Tasks:**

1. **Create `.github/workflows/deploy.yml`** triggered on push to `main` (after CI passes):
   - Build and push Docker image to container registry
   - Deploy to staging via Kamal
   - Run smoke tests against staging (health check, basic API call)
   - Require manual approval gate for production
   - Deploy to production via Kamal

2. **Enable Kamal hooks** — Rename the relevant `.sample` files in `apps/core/.kamal/hooks/`:
   - `pre-deploy` — Verify CI is green via GitHub API before deploying
   - `post-deploy` — Post deployment summary (Slack/webhook notification)

3. **Define a staging environment:**
   - `apps/core/config/environments/staging.rb` (if not already present)
   - Staging database configuration in `database.yml`
   - Staging-specific env vars documentation in `.env.example`

4. **Create a Dockerfile for the AI Gateway** — `apps/ai-gateway/Dockerfile` does not exist. Follow the same hardening practices as the core Dockerfile (multi-stage, non-root, slim base, HEALTHCHECK at `/v1/health`).

---

## 12. Add code coverage tooling and CI thresholds

**Current state:** No coverage tooling in any service. No way to measure or enforce test coverage.

### Rails Core

1. Add `gem "simplecov", require: false` to the `:test` group in `Gemfile`
2. At the top of `spec/rails_helper.rb` (before any other require):
   ```ruby
   require "simplecov"
   SimpleCov.start "rails" do
     minimum_coverage 80
     add_filter "/spec/"
     add_filter "/config/"
     add_filter "/db/"
   end
   ```
3. Add `coverage/` to `.gitignore`
4. In CI, archive the coverage report as an artifact or integrate with Codecov/Coveralls

### AI Gateway

1. Add `pytest-cov>=6.0,<7.0` to dev dependencies in `pyproject.toml`
2. Update `[tool.pytest.ini_options]`:
   ```toml
   addopts = "-q --cov=app --cov-report=term-missing --cov-fail-under=80"
   ```
3. Add `.coverage` and `htmlcov/` to `.gitignore`

### Next.js Web

1. After setting up Vitest (item 7), add `@vitest/coverage-v8` as a dev dependency
2. Configure `vitest.config.ts` with:
   ```ts
   coverage: {
     provider: "v8",
     reporter: ["text", "lcov"],
     include: ["src/**"],
     thresholds: { lines: 60 } // Start low, ratchet up
   }
   ```

---

## 13. Implement deeper health checks

**Current state:**
- Rails: `GET /up` returns 200 if the app boots (standard `rails/health#show` — checks nothing beyond app startup)
- AI Gateway: `GET /v1/health` returns `{"status": "ok"}` with a timestamp (checks nothing beyond app startup)

**Improve to check actual dependencies:**

### Rails `/up` or new `/api/v1/health`

Create a dedicated health controller that checks:
1. **Database** — `ActiveRecord::Base.connection.execute("SELECT 1")`
2. **Redis/Cache** — `Rails.cache.write("health_check", "ok"); Rails.cache.read("health_check")`
3. **Queue** — `SolidQueue::Job.count` (verify queue DB is accessible)

Return:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "queue": "ok"
  }
}
```

Return 503 with the failed component if any check fails. Keep the existing `/up` endpoint as a simple liveness probe and use the detailed one as a readiness probe.

### AI Gateway `/v1/health`

Check:
1. **Provider reachability** — lightweight check that at least one provider has a configured API key
2. Return degraded status if no providers are configured

### Docker HEALTHCHECK

After the health endpoints are improved, ensure the Dockerfile `HEALTHCHECK` instructions reference the correct endpoints.

---

## 14. Add pre-commit hooks

**Current state:** No husky, lint-staged, or lefthook configuration. Developers can push code that fails CI lint checks.

**Steps:**

1. **Install husky** at the repo root:
   ```
   npm install -D husky lint-staged
   npx husky init
   ```

2. **Configure lint-staged** in root `package.json` (create a minimal root `package.json` if one doesn't exist):
   ```json
   {
     "lint-staged": {
       "apps/web/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
       "apps/web/**/*.{json,md,css}": ["prettier --write"]
     }
   }
   ```

3. **Add a pre-commit hook** (`.husky/pre-commit`):
   ```bash
   npx lint-staged
   cd apps/core && bundle exec rubocop --autocorrect-all --force-exclusion $(git diff --cached --name-only --diff-filter=ACM -- '*.rb' | sed 's|^|../../|')
   cd apps/ai-gateway && ruff check --fix $(git diff --cached --name-only --diff-filter=ACM -- '*.py' | sed 's|^|../../|')
   ```
   (Adjust paths as needed — the key is that each service's linter runs only on staged files.)

4. **Alternative:** Consider `lefthook` instead of husky for polyglot repos — it has native support for running different tools per directory without shell gymnastics.

---

## 15. Add client-side role-based route guards

**Current state:** `apps/web/src/components/ProtectedRoute.tsx` checks authentication only. A logged-in student can navigate to `/admin/*` URLs — the backend will reject the API calls, but the user sees broken/empty pages instead of a proper redirect.

**Tasks:**

1. Ensure the auth context exposes the current user's roles (e.g. `user.roles: string[]`).
2. Extend `ProtectedRoute` to accept an optional `requiredRoles` prop:
   ```tsx
   <ProtectedRoute requiredRoles={["admin", "curriculum_lead"]}>
     <AdminLayout />
   </ProtectedRoute>
   ```
3. If the user lacks the required role, redirect to a "not authorized" page or back to the dashboard.
4. Apply role guards to the route groups:
   - `/admin/*` — `admin` only
   - `/plan/*` — `admin`, `curriculum_lead`, `teacher`
   - `/teach/*` — `admin`, `teacher`
   - `/assess/*` — `admin`, `teacher` (students access via separate paths)
   - `/communicate/*` — all authenticated roles

Review `apps/core/app/policies/` for the canonical role→permission mappings and mirror them on the client.

---

## 16. Document database backup and disaster recovery

**Current state:** No backup scripts, no PITR documentation, no replication/failover setup. `config/database.yml` defines three production databases (`core_production`, `core_production_cache`, `core_production_queue`) but there is no documented strategy for protecting them.

**Deliverables:**

1. **`docs/DATABASE_BACKUP.md`** covering:
   - `pg_dump` schedule for the primary database (daily full, hourly WAL archiving)
   - Whether cache and queue DBs need backup (likely no — they're ephemeral)
   - Backup storage location (S3 bucket, retention policy)
   - Point-in-time recovery (PITR) configuration via WAL-G or pg_basebackup
   - Restore procedure (step-by-step runbook)
   - RTO/RPO targets for a K-12 platform

2. **Backup script** in `scripts/backup.sh` that can be cron'd or triggered by a scheduled GitHub Action.

3. **Connection pooling guidance** — The current `database.yml` sets `max_connections` from `RAILS_MAX_THREADS` (default 5). Document whether a connection pooler like PgBouncer should sit in front of PostgreSQL in production, and the recommended pool sizes for the expected load.

---

## 17. Create a Dockerfile for the AI Gateway

**Current state:** `apps/ai-gateway/` has no Dockerfile. Only `apps/core/` has one.

**Create `apps/ai-gateway/Dockerfile`:**

```dockerfile
# --- Builder stage ---
FROM python:3.11-slim AS builder
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir --prefix=/install .

# --- Runtime stage ---
FROM python:3.11-slim
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
WORKDIR /app
COPY --from=builder /install /usr/local
COPY app/ app/
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/v1/health').raise_for_status()"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Also create `apps/ai-gateway/.dockerignore`:
```
.git
.venv
venv
__pycache__
tests/
*.pyc
.env
.mypy_cache
.pytest_cache
.ruff_cache
```

---

## Additional items to consider when capacity allows

These came up during the audit but are lower severity:

- **`default_scope` for tenant isolation** — The `TenantScoped` concern uses `default_scope`, which is a known Rails footgun (`.unscoped` workarounds are already appearing). Consider migrating to explicit scoping via `Current.tenant.resources` on a per-query basis. This is a large refactor — plan carefully.
- **Missing `return` after `render` in `drive_controller.rb:52`** — `require_google_connected` calls `render` but doesn't `return`, so the action continues executing. Add `return` or switch to a `before_action` that halts the chain.
- **Bare `rescue => e` in background jobs** — `classroom_roster_sync_job.rb:77` and `:85` catch all exceptions. Replace with specific types (`ActiveRecord::RecordInvalid`, `Google::Apis::Error`, etc.) and let unexpected exceptions bubble up to the job retry/error system.
- **Duplicated `privileged_user?`** — Defined in both the `Scope` inner class (line 57) and the policy itself (line 78) in `assignment_policy.rb`. Extract to `ApplicationPolicy` or a shared concern since it appears in multiple policies.
- **Silent error suppression** — `apps/web/src/app/dashboard/page.tsx:52-54` has an empty `catch {}` block. At minimum log the error; better yet, render a user-facing error state.
- **No `Content-Type` validation in AI Gateway** — POST endpoints accept JSON but don't reject non-JSON content types explicitly. FastAPI handles this to a degree, but explicit validation prevents edge cases.
- **`packages/ui`** is an empty placeholder — Decide whether to implement a shared component library or remove the directory to avoid confusion.
