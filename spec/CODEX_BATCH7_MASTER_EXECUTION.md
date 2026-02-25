# CODEX Batch 7 — Master Execution Instructions (v2)

**Revised:** 2026-02-25
**Total Tasks:** 10
**Estimated Remaining Effort:** ~45–58 hours
**Prerequisite:** Batch 1–6 complete. Verify green baseline before starting.

> **This is the authoritative execution guide for Batch 7.**
> Read this file first. It tells you exactly what has been built,
> what still needs to be built, and which spec file to follow for each task.

---

## Current Build Status

| # | Task | Spec File | Status | Remaining |
|---|------|-----------|--------|-----------|
| 1 | Security Audit | `CODEX_TASK_01_SECURITY_AUDIT.md` | ⚠️ Partial | CSP headers, session config, RLS test, bundle-audit CI |
| 2 | Database Scaling | `CODEX_TASK_02_DATABASE_SCALING.md` | ⚠️ Partial | N+1 fixes, materialized views, pg_stat_statements, PgBouncer |
| 3 | E2E Regression Suite | `CODEX_E2E_REGRESSION_SUITE.md` | ⚠️ Partial | google-native, ai-planning, cross-cutting tests |
| 4 | Monitoring & Alerting | `CODEX_TASK_04_MONITORING_ALERTING.md` | ❌ Not started | Everything |
| 5 | Backup & Restore | `CODEX_TASK_03_BACKUP_RESTORE.md` | ❌ Not started | Everything |
| 6 | CDN & Asset Optimization | `CODEX_CDN_ASSET_OPTIMIZATION.md` | ❌ Not started | Everything |
| 7 | API Documentation Portal | `CODEX_API_DOCUMENTATION_PORTAL.md` | ❌ Not started | Everything |
| 8 | Tenant Provisioning | `CODEX_TASK_05_TENANT_PROVISIONING.md` | ❌ Not started | Everything |
| 9 | AI Safety Depth | `CODEX_TASK_06_AI_SAFETY.md` | ❌ Not started | Everything |
| 10 | Zero-Downtime Deployment | `CODEX_TASK_07_DEPLOY_INFRASTRUCTURE.md` | ❌ Not started | Everything |

---

## Execution Protocol

### Before Starting Any Task

1. Read `AGENTS.md` and `CLAUDE.md` at the project root.
2. Confirm green baseline on all three services:
   ```bash
   cd apps/core && bundle exec rspec
   cd apps/core && bundle exec rubocop
   cd apps/web && npm run typecheck && npm run lint
   cd apps/ai-gateway && pytest
   ```
3. If any tests fail, fix them before proceeding. Do not start new work on a broken baseline.

### For Each Task

1. **Read the spec file completely** before writing a single line of code.
2. **Check the "Already Implemented" section** in the spec. Do not re-implement what already exists.
3. **Create a feature branch:**
   ```bash
   git checkout main && git pull origin main
   git checkout -b batch7/<task-number>-<short-name>
   ```
4. **Implement only what the spec marks as remaining.**
5. **Run tests** per the Definition of Done in the spec.
6. **Fix all failures** before committing.
7. **Commit and push:**
   ```bash
   git add -A
   git commit -m "Batch 7 Task <N>: <Title>

   Implements spec/<SPEC_FILENAME>.md
   - <what was built>
   - All tests passing"
   git push origin batch7/<task-number>-<short-name>
   ```
8. **Merge to main and confirm before starting the next task.**

---

## Phase A — P0 Launch Blockers

All three may run in parallel. No inter-dependencies.

---

### Task 1: Security Audit Final

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_TASK_01_SECURITY_AUDIT.md` |
| Priority | P0 |
| Branch | `batch7/01-security-audit` |
| Commit | `Batch 7 Task 1: Security Audit Final` |

**Already done — do not redo:**
- `apps/core/app/validators/safe_url_validator.rb` — SSRF prevention ✓
- `apps/core/app/models/concerns/attachment_validatable.rb` — upload validation ✓
- `apps/core/config/initializers/rack_attack.rb` — rate limiting with expanded throttles ✓
- `apps/core/config/initializers/security_headers.rb` — X-Frame-Options, X-Content-Type-Options, etc. ✓
- Brakeman runs in CI ✓

**Still needed (implement these):**
- `apps/core/config/initializers/content_security_policy.rb`
- `apps/core/config/initializers/session_store.rb`
- `apps/core/spec/models/rls_verification_spec.rb`
- `apps/core/spec/validators/safe_url_validator_spec.rb` (if missing)
- `apps/core/spec/models/concerns/attachment_validatable_spec.rb` (if missing)
- Bundle-audit CI step in `.github/workflows/core.yml`
- Verify Brakeman reports zero warnings; fix any findings

**After commit verify:**
- [ ] `bundle exec brakeman` reports zero warnings
- [ ] `bundle audit check` reports no high/critical vulnerabilities
- [ ] `session_store.rb` sets Secure, HttpOnly, SameSite on cookies
- [ ] `content_security_policy.rb` configures CSP headers
- [ ] `rls_verification_spec.rb` passes for all tenant-scoped tables
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes

---

### Task 2: Database Scaling

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_TASK_02_DATABASE_SCALING.md` |
| Priority | P0 |
| Branch | `batch7/02-database-scaling` |
| Commit | `Batch 7 Task 2: Database Scaling` |

**Already done — do not redo:**
- Migration `20260217000004_add_counter_caches.rb` — counter caches on 7 tables ✓
- Migration `20260217000005_add_performance_indexes_v2.rb` — composite indexes ✓

**Still needed (implement these):**
- Verify `counter_cache: true` is actually on the correct `belongs_to` in each model file (`assignment.rb`, `submission.rb`, `discussion.rb`, `discussion_post.rb`, `quiz.rb`, `enrollment.rb`, `question.rb`). The migration added columns but model associations must be verified.
- Bullet gem in `Gemfile` (dev/test), configured in `development.rb` and `test.rb`
- N+1 eager loading fixes on `CoursesController`, `AssignmentsController`, `SubmissionsController`, `EnrollmentsController`, `UsersController`, `QuizzesController`, `DiscussionsController`
- `sidekiq-cron` gem if not present
- Migration `create_analytics_materialized_views` — `tenant_daily_stats` and `course_engagement_stats` views
- `apps/core/app/jobs/refresh_analytics_views_job.rb`
- Migration `enable_pg_stat_statements`
- `apps/core/app/services/slow_query_service.rb`
- `apps/core/config/pgbouncer.ini.example`
- `apps/core/config/database.yml` — pool size, checkout timeout, reaping_frequency
- Tests: `counter_cache_spec.rb`, `refresh_analytics_views_job_spec.rb`, `slow_query_service_spec.rb`

**After commit verify:**
- [ ] Bullet raises on N+1 in test environment; no N+1 in spec suite
- [ ] Materialized views exist in schema
- [ ] `RefreshAnalyticsViewsJob` runs without error
- [ ] `SlowQueryService.top_queries` returns array
- [ ] `database.yml` has pool/timeout/reaping config
- [ ] `pgbouncer.ini.example` documents connection pooling
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes

---

### Task 3: E2E Regression Suite

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_E2E_REGRESSION_SUITE.md` |
| Priority | P0 |
| Branch | `batch7/03-e2e-regression` |
| Commit | `Batch 7 Task 3: E2E Regression Suite` |

**Already done — do not redo:**
- `apps/web/e2e/teacher-planning.spec.ts` ✓
- `apps/web/e2e/course-delivery.spec.ts` ✓
- `apps/web/e2e/assessment.spec.ts` ✓
- `apps/web/e2e/auth.spec.ts` ✓
- `apps/web/e2e/admin.spec.ts` ✓
- `apps/web/e2e/network-resilience.spec.ts` ✓
- `apps/web/e2e/helpers/auth.ts` ✓
- `apps/web/e2e/helpers/seed.ts` ✓
- E2E CI step in `.github/workflows/ci.yml` ✓

**Still needed (implement these):**
- `apps/web/e2e/google-native.spec.ts` — PRD-20: Drive file attach → link to assignment (mock Drive picker)
- `apps/web/e2e/ai-planning.spec.ts` — PRD-21: AI generate → stream → apply-to-plan → policy banner visible (mock AI gateway)
- `apps/web/e2e/cross-cutting.spec.ts` — multi-tenant isolation (user from tenant A cannot see tenant B data), RBAC boundary (student cannot access teacher routes), admin curriculum map and approval queue flows

> **Note on file locations:** Existing tests are at `apps/web/e2e/` (root), NOT in an `e2e/workflows/` subdirectory. Add the three new test files to `apps/web/e2e/` at the root level to match the existing structure.

**After commit verify:**
- [ ] `npx playwright test` runs all 9 spec files and all pass
- [ ] google-native.spec.ts covers Drive attach → assign flow (mocked)
- [ ] ai-planning.spec.ts covers AI generate → apply-to-plan → policy banner (mocked)
- [ ] cross-cutting.spec.ts covers multi-tenant isolation and RBAC boundary
- [ ] All E2E tests pass in CI

---

## Phase B — P1 Operations

Tasks 4 and 5 depend on Task 2. Task 6 has no dependencies.
Start Phase B only after Phase A is fully merged to main.

---

### Task 4: Monitoring & Alerting

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_TASK_04_MONITORING_ALERTING.md` |
| Priority | P1 |
| Depends On | **Task 2** |
| Branch | `batch7/04-monitoring-alerting` |
| Commit | `Batch 7 Task 4: Monitoring and Alerting` |

**Already done:** Nothing. Full implementation required.

**What to build:** See `CODEX_TASK_04_MONITORING_ALERTING.md` for complete implementation details.

Summary:
- `AlertConfiguration` model + migration (metric, threshold, comparison, severity, cooldown)
- `SystemHealthService` (database, Redis, Sidekiq, storage, AI gateway health + metrics)
- `AlertEvaluationJob` (every 5 min via Sidekiq cron)
- `UptimeMonitorJob` (every 2 min via Sidekiq cron)
- `SlackNotifier` service (webhook delivery)
- `Api::V1::Admin::OperationsController` (GET health endpoint)
- `Api::V1::Admin::AlertConfigurationsController` (CRUD)
- `OperationsPolicy`, `AlertConfigurationPolicy`
- `AlertConfigurationSerializer`
- Default alert seeds in `db/seeds/alert_defaults.rb`
- Full spec suite (model, service, job, request specs)
- Routes added under `namespace :admin`

**After commit verify:**
- [ ] `AlertConfiguration` model validates metric, comparison, severity
- [ ] `SystemHealthService.check_all` returns timestamp, overall, checks, metrics
- [ ] `AlertEvaluationJob` triggers and respects cooldown
- [ ] `SlackNotifier` sends to webhook when URL set; silent when not
- [ ] Health API returns 200 for admin, 403 for non-admin
- [ ] Alert CRUD works for admin role
- [ ] Default alerts seeded
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes

---

### Task 5: Backup & Restore Automation

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_TASK_03_BACKUP_RESTORE.md` |
| Priority | P1 |
| Depends On | **Task 2** |
| Branch | `batch7/05-backup-restore` |
| Commit | `Batch 7 Task 5: Backup and Restore Automation` |

**Already done:** `scripts/backup.sh` (basic shell script — not sufficient, full Rails implementation required).

**What to build:** See `CODEX_TASK_03_BACKUP_RESTORE.md` for complete implementation details.

Summary:
- `BackupRecord` model + migration (NOT tenant-scoped — system-level)
- `DatabaseBackupJob` (pg_dump + gzip → S3, records metadata, schedules verification)
- `BackupVerificationJob` (restore to temp DB, compare row counts)
- `Api::V1::Admin::BackupsController` (index, show, create, status)
- `BackupPolicy` (admin only)
- `BackupRecordSerializer`
- Routes under `namespace :admin`
- Daily cron schedule at 2 AM
- Full spec suite (model, job, request specs)

**After commit verify:**
- [ ] `BackupRecord` model validates backup_type, status, s3_key, s3_bucket
- [ ] `DatabaseBackupJob` enqueues in low queue
- [ ] `BackupVerificationJob` skips non-completed records
- [ ] Backup API: list requires admin, trigger enqueues job, status returns summary
- [ ] Non-admin gets 403 on all backup endpoints
- [ ] Daily backup scheduled
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes

---

### Task 6: CDN & Asset Optimization

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_CDN_ASSET_OPTIMIZATION.md` |
| Priority | P1 |
| Depends On | None (may run in parallel with Tasks 4 and 5) |
| Branch | `batch7/06-cdn-assets` |
| Commit | `Batch 7 Task 6: CDN and Asset Optimization` |

**Already done:** Nothing. `next.config.ts` has Sentry/Turbopack config only.

**What to build:** See `CODEX_CDN_ASSET_OPTIMIZATION.md` for complete implementation details.

Summary:
- `next.config.ts` — add `assetPrefix: process.env.CDN_URL || ""`, `images` config (domains, formats, sizes), `compress: true`, cache headers for `/_next/static/`
- `apps/web/package.json` — add `@next/bundle-analyzer` (devDependency)
- `apps/web/src/app/layout.tsx` — switch to `next/font` (Inter), remove any external Google Fonts `<link>` tag
- Dynamic imports for heavy components: `GradebookGrid`, `TrendChart`, `AiAssistantPanel`, `VersionDiff`
- `apps/web/public/sw.js` — versioned cache (`k12-v2`), clean old caches on activate, network-first for API, cache-first for static
- `apps/web/src/lib/performance.ts` — Web Vitals reporting via PerformanceObserver
- `apps/web/e2e/performance/compression.spec.ts` — verify gzip/brotli on static assets
- `apps/web/e2e/performance/cache-headers.spec.ts` — verify immutable cache headers
- `docs/BUNDLE_SIZE_BASELINES.md` — per-route size targets
- `infrastructure/cdn/cloudfront.md` — CDN setup documentation

**After commit verify:**
- [ ] `next.config.ts` has `assetPrefix`, `images`, cache headers configured
- [ ] `@next/bundle-analyzer` in package.json devDependencies
- [ ] `layout.tsx` uses `next/font/google` — no external font `<link>` tag
- [ ] Gradebook, AiAssistantPanel, VersionDiff, chart components use `dynamic()`
- [ ] `sw.js` uses versioned cache names and cleans old caches on activate
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

---

## Phase C — P1 Developer Experience

Task 7 has no dependencies. Task 8 depends on Tasks 1 and 5.
Start Phase C only after Phase B is fully merged to main.

---

### Task 7: API Documentation Portal

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_API_DOCUMENTATION_PORTAL.md` |
| Priority | P1 |
| Depends On | None (may run in parallel with Task 8 if Task 8's deps are met) |
| Branch | `batch7/07-api-docs` |
| Commit | `Batch 7 Task 7: API Documentation Portal` |

**Already done:** OpenAPI YAML specs in `packages/contracts/` — no Swagger UI or docs pages.

**What to build:** See `CODEX_API_DOCUMENTATION_PORTAL.md` for complete implementation details.

Summary:
- Swagger UI served at `/docs/api` (or via rswag gem in Rails, or Next.js pages)
- Auth guide page — session cookie auth, bearer token auth, webhook HMAC signature
- Webhook integration guide — payload schemas, signature verification code examples
- Rate limits reference — per endpoint category
- Error codes reference — all HTTP status codes used by the API
- API changelog — version history and deprecation policy
- Shared docs layout component

**After commit verify:**
- [ ] `/docs/api` renders Swagger UI or ReDoc with the OpenAPI spec loaded
- [ ] Auth guide page accessible and documents all auth methods
- [ ] Webhook guide includes payload schemas and signature verification
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

---

### Task 8: Tenant Provisioning

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_TASK_05_TENANT_PROVISIONING.md` |
| Priority | P1 |
| Depends On | **Task 1** (Security Audit), **Task 5** (Backup/Restore) |
| Branch | `batch7/08-tenant-provisioning` |
| Commit | `Batch 7 Task 8: Tenant Provisioning` |

**Already done:** Nothing. Full implementation required.

**What to build:** See `CODEX_TASK_05_TENANT_PROVISIONING.md` for complete implementation details.

Summary:
- `TenantProvisioningService` (creates tenant + school + roles + permissions + admin user + academic year + AI policies + standard frameworks in one transaction)
- `OnboardingChecklistService` (tracks 10 setup milestones per tenant)
- `DataImportService` (CSV user import + OneRoster roster import)
- School branding support (logo, primary color, favicon)
- `ProvisioningController` with bulk create endpoint
- Super-admin provisioning page
- Setup wizard onboarding checklist integration
- Full spec suite

**After commit verify:**
- [ ] `TenantProvisioningService.provision!` creates tenant and all related records in one transaction
- [ ] `OnboardingChecklistService` tracks setup milestones and returns completion percentage
- [ ] CSV import creates users with correct roles
- [ ] Provisioning API requires super-admin role
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes

---

## Phase D — P2 Advanced

Task 9 has no dependencies. Task 10 depends on Task 4.
Start Phase D only after Phase C is fully merged to main.

---

### Task 9: AI Safety Depth

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_TASK_06_AI_SAFETY.md` |
| Priority | P2 |
| Depends On | None (may run in parallel with Task 10 after Task 4 is done) |
| Branch | `batch7/09-ai-safety` |
| Commit | `Batch 7 Task 9: AI Safety Depth` |

**Already done:** `apps/ai-gateway/app/safety/filters.py` — basic regex filters only. Full pipeline not implemented.

**What to build:** See `CODEX_TASK_06_AI_SAFETY.md` for complete implementation details.

Summary:
- `SafetyPipeline` class (multi-layer filter chain: injection → XSS → PII → content classification → output scan)
- `PIIFilter` (emails, phone numbers, SSNs, student IDs — detect and redact)
- `ContentClassifier` (weighted keyword scoring, configurable per grade band: K-5 strict, 6-8 moderate, 9-12 standard)
- `SafetyEvent` Rails model (logs every block, redaction, classification result)
- Safety events API (`/api/v1/admin/safety_events`)
- Safety dashboard stats endpoint
- Per-tenant safety level configuration via `AiTaskPolicy`
- Full pytest suite for gateway; RSpec for Rails model/controller

**After commit verify:**
- [ ] `SafetyPipeline` blocks prompt injection attempts
- [ ] `PIIFilter` redacts emails, SSNs, phone numbers
- [ ] `ContentClassifier` applies correct level based on grade band config
- [ ] `SafetyEvent` model saves every filter action with tenant context
- [ ] Safety events API returns data for admin role only
- [ ] `pytest` passes (AI gateway)
- [ ] `bundle exec rspec` passes (Rails)
- [ ] `bundle exec rubocop` passes

---

### Task 10: Zero-Downtime Deployment

| Field | Value |
|-------|-------|
| Spec | `spec/CODEX_TASK_07_DEPLOY_INFRASTRUCTURE.md` |
| Priority | P2 |
| Depends On | **Task 4** (Monitoring & Alerting) |
| Branch | `batch7/10-deploy-infrastructure` |
| Commit | `Batch 7 Task 10: Zero-Downtime Deployment` |

**Already done:** Basic `.github/workflows/deploy.yml` (generic Railway deploy, no blue-green), `scripts/smoke-test.sh`.

**What to build:** See `CODEX_TASK_07_DEPLOY_INFRASTRUCTURE.md` for complete implementation details.

Summary:
- `apps/core/app/models/concerns/safe_migration.rb` — expand-contract migration pattern helpers
- `apps/core/app/models/feature_flag.rb` — per-tenant feature flag with override support
- `scripts/deploy-blue-green.sh` — build green, deploy, migrate, health check, smoke test, switch traffic
- `scripts/rollback.sh` — switch back to blue on failure
- `scripts/deploy-window-check.sh` — block deploys during 8 AM–3 PM school hours
- Update `.github/workflows/deploy.yml` — integrate deploy window check, call blue-green script, auto-rollback on health failure, Slack notification
- Seed default feature flags
- Full spec suite (model + script tests)

**After commit verify:**
- [ ] `FeatureFlag` model validates key and respects per-tenant overrides
- [ ] `SafeMigration` concern provides `safe_add_column`, `safe_remove_column`
- [ ] `deploy-window-check.sh` exits non-zero during school hours
- [ ] Deploy workflow calls window check before deploying
- [ ] Rollback script switches traffic back to blue environment
- [ ] Slack deploy notification fires on success and failure
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes

---

## Final Verification

After all 10 tasks are merged to main:

```bash
git checkout main && git pull origin main

# Rails
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop

# Next.js
cd apps/web && npm run typecheck
cd apps/web && npm run lint
cd apps/web && npm run build

# AI Gateway
cd apps/ai-gateway && pytest

# E2E
cd apps/web && npx playwright test
```

All checks must pass. Batch 7 is complete when this final verification succeeds.

---

## Dependency Graph

```
Phase A (P0 — no deps, run in parallel)
  [1] Security Audit
  [2] Database Scaling
  [3] E2E Regression Suite

Phase B (P1 — after Phase A)
  [4] Monitoring & Alerting     ← depends on [2]
  [5] Backup & Restore          ← depends on [2]
  [6] CDN & Asset Optimization  ← no deps (parallel with 4, 5)

Phase C (P1 — after Phase B)
  [7] API Documentation Portal  ← no deps (parallel with 8)
  [8] Tenant Provisioning       ← depends on [1], [5]

Phase D (P2 — after Phase C)
  [9]  AI Safety Depth          ← no deps
  [10] Zero-Downtime Deployment ← depends on [4]
```

---

## Task Summary

| # | Task | Phase | Spec File | Deps | Status |
|---|------|-------|-----------|------|--------|
| 1 | Security Audit Final | A | `CODEX_TASK_01_SECURITY_AUDIT.md` | — | ⚠️ Partial |
| 2 | Database Scaling | A | `CODEX_TASK_02_DATABASE_SCALING.md` | — | ⚠️ Partial |
| 3 | E2E Regression Suite | A | `CODEX_E2E_REGRESSION_SUITE.md` | — | ⚠️ Partial |
| 4 | Monitoring & Alerting | B | `CODEX_TASK_04_MONITORING_ALERTING.md` | 2 | ❌ Not started |
| 5 | Backup & Restore | B | `CODEX_TASK_03_BACKUP_RESTORE.md` | 2 | ❌ Not started |
| 6 | CDN & Asset Optimization | B | `CODEX_CDN_ASSET_OPTIMIZATION.md` | — | ❌ Not started |
| 7 | API Documentation Portal | C | `CODEX_API_DOCUMENTATION_PORTAL.md` | — | ❌ Not started |
| 8 | Tenant Provisioning | C | `CODEX_TASK_05_TENANT_PROVISIONING.md` | 1, 5 | ❌ Not started |
| 9 | AI Safety Depth | D | `CODEX_TASK_06_AI_SAFETY.md` | — | ❌ Not started |
| 10 | Zero-Downtime Deployment | D | `CODEX_TASK_07_DEPLOY_INFRASTRUCTURE.md` | 4 | ❌ Not started |
