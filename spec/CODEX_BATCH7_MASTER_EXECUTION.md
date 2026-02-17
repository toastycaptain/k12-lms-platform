# CODEX Batch 7 — Master Execution Instructions

**Date:** 2026-02-17
**Total Specs:** 10
**Estimated Effort:** 59–78 hours
**Prerequisite:** All Batch 1–6 specs complete (68 total)

---

## Execution Protocol

### Before Starting

1. Read `AGENTS.md` and `CLAUDE.md` at the project root for critical rules and patterns.
2. Run all existing tests to confirm green baseline:
   ```bash
   cd apps/core && bundle exec rspec
   cd apps/web && npm run typecheck && npm run lint
   cd apps/ai-gateway && pytest
   ```
3. If any tests fail, fix them before proceeding. Do not start Batch 7 on a broken baseline.

### For Each Task

Follow this cycle for every spec file listed below:

1. **Read the spec** — Open the spec file from `spec/` and read it completely.
2. **Create a feature branch** — Branch from `main`:
   ```bash
   git checkout main && git pull origin main
   git checkout -b batch7/<task-number>-<short-name>
   ```
3. **Execute all tasks** in the spec — Create files, modify files, write tests, exactly as described.
4. **Run tests** — Verify the Definition of Done:
   ```bash
   # Rails specs
   cd apps/core && bundle exec rspec

   # Rubocop
   cd apps/core && bundle exec rubocop

   # TypeScript + lint
   cd apps/web && npm run typecheck
   cd apps/web && npm run lint

   # AI gateway (if modified)
   cd apps/ai-gateway && pytest
   ```
5. **Fix any failures** — Do not proceed until all tests pass and all linting is clean.
6. **Commit and push**:
   ```bash
   git add -A
   git commit -m "Batch 7 Task <N>: <Spec Title>

   Implements spec/<SPEC_FILENAME>.md
   - <1-line summary of what was built>
   - All tests passing"
   git push origin batch7/<task-number>-<short-name>
   ```
7. **Merge to main**:
   ```bash
   git checkout main
   git merge batch7/<task-number>-<short-name>
   git push origin main
   ```
8. **Proceed to next task** — Only after the merge is confirmed on main.

---

## Task Sequence

Execute tasks in this exact order. Respect dependencies — a task cannot start until all tasks it depends on are merged to main.

---

### Phase A — P0 Launch Blockers (Tasks 1–3)

Phase A tasks have **no dependencies**. They may be executed in parallel if multiple agents are available, or sequentially in the order listed.

#### Task 1: Security Audit Final

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_SECURITY_AUDIT_FINAL.md` |
| Priority | P0 |
| Effort | Medium (6–8h) |
| Depends On | None |
| Branch | `batch7/1-security-audit-final` |
| Commit Message | `Batch 7 Task 1: Security Audit Final` |

**What to build:** Dependency scanning with Bundler Audit + npm audit, Brakeman static analysis, CSP headers, cookie security hardening, file upload validation, SSRF prevention, RLS verification on all Batch 6 tables, rate limiting expansion, XSS audit, and security checklist documentation.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

#### Task 2: Database Scaling

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_DATABASE_SCALING.md` |
| Priority | P0 |
| Effort | Medium (6–8h) |
| Depends On | None |
| Branch | `batch7/2-database-scaling` |
| Commit Message | `Batch 7 Task 2: Database Scaling` |

**What to build:** PgBouncer connection pooling configuration, read replica routing with Makara, pg_stat_statements dashboard, N+1 query fixes (eager loading audit), counter caches on 8 high-traffic columns, materialized views for analytics aggregations, and composite index audit.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

#### Task 3: E2E Regression Suite

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_E2E_REGRESSION_SUITE.md` |
| Priority | P0 |
| Effort | Medium (8–10h) |
| Depends On | None |
| Branch | `batch7/3-e2e-regression-suite` |
| Commit Message | `Batch 7 Task 3: E2E Regression Suite` |

**What to build:** Playwright E2E tests covering all 5 PRD key workflows (teacher planning, course delivery, assessment, Google-native ops, AI-assisted planning), cross-cutting tests (multi-tenant isolation, RBAC boundary, responsive layout, offline resilience), and CI pipeline integration.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

### Phase B — P1 Operations (Tasks 4–6)

Phase B starts after Phase A is merged to main. Tasks 4 and 5 depend on Task 2. Task 6 has no dependencies and may run in parallel with 4 and 5.

#### Task 4: Monitoring and Alerting

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_MONITORING_ALERTING.md` |
| Priority | P1 |
| Effort | Medium (6–8h) |
| Depends On | **Task 2** (Database Scaling) |
| Branch | `batch7/4-monitoring-alerting` |
| Commit Message | `Batch 7 Task 4: Monitoring and Alerting` |

**What to build:** SystemHealthService aggregating app/db/redis/sidekiq/storage health, AlertConfiguration model with configurable thresholds, AlertEvaluationJob running every 5 minutes, UptimeMonitorJob with external endpoint checks, SlackNotifier for alert delivery, operations health dashboard, and alert configuration admin page.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

#### Task 5: Backup and Restore Automation

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_BACKUP_RESTORE_AUTOMATION.md` |
| Priority | P1 |
| Effort | Small (3–4h) |
| Depends On | **Task 2** (Database Scaling) |
| Branch | `batch7/5-backup-restore-automation` |
| Commit Message | `Batch 7 Task 5: Backup and Restore Automation` |

**What to build:** DatabaseBackupJob (pg_dump with gzip to S3), BackupVerificationJob (restore to temp DB and verify row counts), BackupRecord model tracking backup history, S3 lifecycle rules for retention, backup admin page showing history and verification status.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

#### Task 6: CDN and Asset Optimization

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_CDN_ASSET_OPTIMIZATION.md` |
| Priority | P1 |
| Effort | Medium (6–8h) |
| Depends On | None |
| Branch | `batch7/6-cdn-asset-optimization` |
| Commit Message | `Batch 7 Task 6: CDN and Asset Optimization` |

**What to build:** CDN configuration with asset prefix and cache headers, bundle analyzer setup, Next.js Image component migration, next/font optimization, dynamic imports for heavy components (gradebook, charts, AI panel, diff viewer), versioned service worker cache strategy, compression verification tests, and Web Vitals reporting.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

### Phase C — P1 Developer Experience (Tasks 7–8)

Phase C starts after Phase B is merged to main. Task 7 has no dependencies. Task 8 depends on Tasks 1 and 5.

#### Task 7: API Documentation Portal

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_API_DOCUMENTATION_PORTAL.md` |
| Priority | P1 |
| Effort | Medium (6–8h) |
| Depends On | None |
| Branch | `batch7/7-api-documentation-portal` |
| Commit Message | `Batch 7 Task 7: API Documentation Portal` |

**What to build:** Swagger UI at /docs/api serving OpenAPI spec, authentication guide (session, token, webhook signature), webhook integration guide with payload schemas and verification code examples, rate limits documentation per endpoint category, error reference with all HTTP status codes, API changelog with deprecation policy, and shared docs layout.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

#### Task 8: Tenant Provisioning

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_TENANT_PROVISIONING.md` |
| Priority | P1 |
| Effort | Medium (6–8h) |
| Depends On | **Task 1** (Security Audit), **Task 5** (Backup/Restore) |
| Branch | `batch7/8-tenant-provisioning` |
| Commit Message | `Batch 7 Task 8: Tenant Provisioning` |

**What to build:** TenantProvisioningService creating tenant/school/roles/permissions/admin in one transaction, OnboardingChecklistService tracking 10 setup items, DataImportService for CSV and OneRoster format, school branding support (logo, color, favicon), provisioning API with bulk create, super admin provisioning page, and setup wizard onboarding checklist.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

### Phase D — P2 Advanced (Tasks 9–10)

Phase D starts after Phase C is merged to main. Task 9 has no dependencies. Task 10 depends on Task 4.

#### Task 9: AI Safety Depth

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_AI_SAFETY_DEPTH.md` |
| Priority | P2 |
| Effort | Medium (6–8h) |
| Depends On | None |
| Branch | `batch7/9-ai-safety-depth` |
| Commit Message | `Batch 7 Task 9: AI Safety Depth` |

**What to build:** SafetyPipeline with multi-layer filter chain, PIIFilter detecting emails/phones/SSNs/student IDs with redaction, ContentClassifier with weighted keyword scoring and configurable safety levels (strict for K-5, moderate for 6-8, standard for 9-12), safety event logging, safety events API for admins, and safety dashboard with stats/trends/event table.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `cd apps/ai-gateway && pytest` passes
- [ ] Pushed and merged to main

---

#### Task 10: Deployment Zero Downtime

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_DEPLOYMENT_ZERO_DOWNTIME.md` |
| Priority | P2 |
| Effort | Medium (6–8h) |
| Depends On | **Task 4** (Monitoring/Alerting) |
| Branch | `batch7/10-deployment-zero-downtime` |
| Commit Message | `Batch 7 Task 10: Deployment Zero Downtime` |

**What to build:** Blue-green deploy script (build, deploy green, migrate, health check, smoke test, switch traffic), rollback automation script, expand-contract migration pattern documentation and SafeMigration module, deploy window protection blocking deploys during school hours (8 AM – 3 PM), FeatureFlag system with per-tenant overrides, deploy notification integration (Slack), and CI pipeline with rollback-on-failure.

**After commit, verify:**
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

## Final Verification

After all 10 tasks are merged to main, run the complete test suite one final time:

```bash
# Pull latest main
git checkout main && git pull origin main

# Rails — full suite
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop

# Next.js — full checks
cd apps/web && npm run typecheck
cd apps/web && npm run lint
cd apps/web && npm run build

# AI Gateway — full suite
cd apps/ai-gateway && pytest

# E2E (if Playwright is configured)
cd apps/web && npx playwright test
```

If all checks pass, Batch 7 is complete. The platform is launch-ready.

---

## Summary

| Task | Spec | Phase | Depends On | Status |
|------|------|-------|------------|--------|
| 1 | CODEX_SECURITY_AUDIT_FINAL | A | — | [ ] |
| 2 | CODEX_DATABASE_SCALING | A | — | [ ] |
| 3 | CODEX_E2E_REGRESSION_SUITE | A | — | [ ] |
| 4 | CODEX_MONITORING_ALERTING | B | 2 | [ ] |
| 5 | CODEX_BACKUP_RESTORE_AUTOMATION | B | 2 | [ ] |
| 6 | CODEX_CDN_ASSET_OPTIMIZATION | B | — | [ ] |
| 7 | CODEX_API_DOCUMENTATION_PORTAL | C | — | [ ] |
| 8 | CODEX_TENANT_PROVISIONING | C | 1, 5 | [ ] |
| 9 | CODEX_AI_SAFETY_DEPTH | D | — | [ ] |
| 10 | CODEX_DEPLOYMENT_ZERO_DOWNTIME | D | 4 | [ ] |
