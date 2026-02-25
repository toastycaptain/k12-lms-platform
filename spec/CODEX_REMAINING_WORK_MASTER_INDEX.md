# CODEX — Remaining Work Master Index

**Date:** 2026-02-25
**Platform State:** Feature-complete across all 7 PRD phases. Batch 1–6 fully executed (68 specs).
**Purpose:** Single authoritative entry point for all remaining work. Read this first before any execution.

---

## How to Use This Document

1. **Identify current batch** — Batch 7 is the active work. Batch 8 is queued.
2. **Check dependencies** — Never start a task until all tasks it depends on are merged to `main`.
3. **Read the individual spec file** — Each task points to a detailed spec with exact files, code, and a Definition of Done.
4. **Follow execution protocol** — See `CODEX_BATCH7_MASTER_EXECUTION.md` (Batch 7) or `CODEX_BATCH8_MASTER_EXECUTION.md` (Batch 8) for branch/commit/merge rules.

---

## Platform Build History

| Batch | Focus | Specs | Status |
|-------|-------|-------|--------|
| 1 | V0 Build | 6 | ✅ Complete |
| 2 | Feature + Quality | 17 | ✅ Complete |
| 3 | Hardening + Integration | 7 | ✅ Complete |
| 4 | Architecture + Workflow | 11 | ✅ Complete |
| 5 | Production Readiness + Expansion | 15 | ✅ Complete |
| 6 | Measurement, Compliance, Content, Scale | 12 | ✅ Complete |
| **7** | **Launch Readiness — Security, Scale, Operations** | **10** | **⏳ In Progress** |
| **8** | **Technical Debt + Post-Launch Features** | **7** | **✅ Complete** |

---

## Batch 7 — Launch Readiness (Active)

**Prerequisite:** Batch 1–6 complete. Start here.
**Master execution file:** `spec/CODEX_BATCH7_MASTER_EXECUTION.md`

### Phase A — P0 Launch Blockers (No Dependencies — Run First)

| # | Task | Spec File | Priority | Effort | Status |
|---|------|-----------|----------|--------|--------|
| 1 | Security Audit Final | `CODEX_TASK_01_SECURITY_AUDIT.md` | P0 | 6–8h | [ ] |
| 2 | Database Scaling | `CODEX_TASK_02_DATABASE_SCALING.md` | P0 | 6–8h | [ ] |
| 3 | E2E Regression Suite | `CODEX_E2E_REGRESSION_SUITE.md` | P0 | 8–10h | [ ] |

All three Phase A tasks are independent and may run in parallel.

**Task 1 — Security Audit Final**
Brakeman static analysis, Bundler Audit + npm audit + pip-audit dependency scanning, RLS verification on all Batch 4–6 tables, CSP headers, cookie security (HttpOnly/Secure/SameSite), file upload content type + size validation, SSRF prevention via SafeUrlValidator, rate limiting expansion for webhooks/compliance/analytics/portfolio endpoints.

**Task 2 — Database Scaling**
PgBouncer connection pooling, Makara read replica routing, pg_stat_statements dashboard, N+1 query eager loading audit and fixes, counter caches on 11 high-traffic columns (submissions_count, enrollments_count, etc.), materialized views for analytics aggregations, composite index audit, K6 load test verification.

**Task 3 — E2E Regression Suite**
Playwright E2E tests proving all 5 PRD key workflows work end-to-end: PRD-17 (teacher planning), PRD-18 (course delivery + grading), PRD-19 (assessment + auto-grade), PRD-20 (Google Drive attach + assign), PRD-21 (AI generate + apply-to-plan). Cross-cutting: multi-tenant isolation, RBAC boundary, offline resilience, guardian view, admin workflow. CI integration.

---

### Phase B — P1 Operations (Start After Phase A Merges to Main)

| # | Task | Spec File | Priority | Effort | Depends On | Status |
|---|------|-----------|----------|--------|------------|--------|
| 4 | Monitoring & Alerting | `CODEX_TASK_04_MONITORING_ALERTING.md` | P1 | 6–8h | Task 2 | [ ] |
| 5 | Backup & Restore Automation | `CODEX_TASK_03_BACKUP_RESTORE.md` | P1 | 3–4h | Task 2 | [ ] |
| 6 | CDN & Asset Optimization | `CODEX_CDN_ASSET_OPTIMIZATION.md` | P1 | 6–8h | None | [ ] |

Task 6 has no dependencies and may run in parallel with Tasks 4 and 5.

**Task 4 — Monitoring & Alerting**
SystemHealthService (DB/Redis/Sidekiq/storage/AI gateway health checks), AlertConfiguration model with thresholds per metric, AlertEvaluationJob (every 5 min), UptimeMonitorJob (external endpoint checks every 2 min), SlackNotifier integration, operations health dashboard at `/admin/health`, alert configuration admin page.

**Task 5 — Backup & Restore Automation**
DatabaseBackupJob (pg_dump + gzip → S3), BackupVerificationJob (restore to temp DB + verify row counts), BackupRecord model tracking backup history and verification status, S3 lifecycle rules for retention, backup admin page at `/admin/backup`.

**Task 6 — CDN & Asset Optimization**
CDN configuration with asset prefix and cache headers, bundle analyzer setup, Next.js `<Image>` migration for all `<img>` tags, `next/font` optimization replacing external Google Fonts link, dynamic imports for heavy components (gradebook, analytics charts, AI panel, diff viewer), versioned service worker cache strategy, compression verification, Web Vitals reporting.

---

### Phase C — P1 Developer Experience (Start After Phase B Merges to Main)

| # | Task | Spec File | Priority | Effort | Depends On | Status |
|---|------|-----------|----------|--------|------------|--------|
| 7 | API Documentation Portal | `CODEX_API_DOCUMENTATION_PORTAL.md` | P1 | 6–8h | None | [ ] |
| 8 | Tenant Provisioning | `CODEX_TASK_05_TENANT_PROVISIONING.md` | P1 | 6–8h | Task 1, Task 5 | [ ] |

Task 7 has no dependencies and may run in parallel with Task 8 if Task 8's dependencies are met.

**Task 7 — API Documentation Portal**
Swagger UI at `/docs/api` serving the expanded OpenAPI spec, authentication guide (session cookies, bearer tokens, webhook HMAC signature), webhook integration guide with payload schemas and verification code examples, rate limits reference per endpoint category, error code reference (all HTTP status codes used), API changelog with version history and deprecation policy, shared docs layout.

**Task 8 — Tenant Provisioning**
TenantProvisioningService (creates tenant + school + default roles + permissions + admin user in one transaction), OnboardingChecklistService (tracks 10 setup milestones), DataImportService (CSV user import + OneRoster roster import), school branding support (logo upload, primary color, favicon), provisioning API with bulk create endpoint, super admin provisioning page, setup wizard onboarding checklist integration.

---

### Phase D — P2 Advanced (Start After Phase C Merges to Main)

| # | Task | Spec File | Priority | Effort | Depends On | Status |
|---|------|-----------|----------|--------|------------|--------|
| 9 | AI Safety Depth | `CODEX_TASK_06_AI_SAFETY.md` | P2 | 6–8h | None | [ ] |
| 10 | Deployment Zero Downtime | `CODEX_TASK_07_DEPLOY_INFRASTRUCTURE.md` | P2 | 6–8h | Task 4 | [ ] |

**Task 9 — AI Safety Depth**
SafetyPipeline with multi-layer filter chain (prompt injection → PII → content classification → output scan), PIIFilter detecting emails/phones/SSNs/student IDs with configurable redaction, ContentClassifier with weighted keyword scoring and grade-band safety levels (K-5 strict, 6-8 moderate, 9-12 standard), SafetyEvent model for logging blocks/redactions, safety events admin API, safety dashboard with stats, trends, and event table.

**Task 10 — Deployment Zero Downtime**
Blue-green deploy script (build green, deploy, migrate, health check, smoke test, switch traffic), rollback automation script (switch back to blue on failure), expand-contract migration pattern documentation + SafeMigration module, deploy window protection blocking deploys during school hours (8 AM–3 PM local time), FeatureFlag model with per-tenant override support, Slack deploy notification, CI pipeline that auto-rolls back on health check failure.

---

## Batch 8 — Technical Debt + Post-Launch Features (Queued)

**Prerequisite:** Batch 7 fully merged to main.
**Master execution file:** `spec/CODEX_BATCH8_MASTER_EXECUTION.md`
**Plan file:** `spec/CODEX_BATCH8_PLAN.md`

| # | Task | Spec File | Priority | Effort | Status |
|---|------|-----------|----------|--------|--------|
| 1 | Duplicate Migration Cleanup | `CODEX_MIGRATION_CLEANUP.md` | P0 | 1–2h | [x] |
| 2 | SWR Data Fetching Layer | `CODEX_SWR_DATA_FETCHING.md` | P1 | 8–10h | [x] |
| 3 | Shared UI Package | `CODEX_SHARED_UI_PACKAGE.md` | P1 | 10–12h | [x] |
| 4 | Postgres Full-Text Search Depth | `CODEX_POSTGRES_FULL_TEXT_SEARCH.md` | P1 | 6–8h | [x] |
| 5 | Network Resilience | `CODEX_NETWORK_RESILIENCE.md` | P1 | 4–6h | [x] |
| 6 | Gradebook Depth | `CODEX_GRADEBOOK_DEPTH.md` | P1 | 6–8h | [x] |
| 7 | Guardian Portal | `CODEX_GUARDIAN_PORTAL.md` | P2 | 12–16h | [x] |

See `CODEX_BATCH8_PLAN.md` for full dependency graph and phase breakdown.

---

## Dependency Graph (All Remaining Work)

```
Batch 7
  Phase A (P0, parallel):
    [1] Security Audit
    [2] Database Scaling
    [3] E2E Regression Suite

  Phase B (P1, after Phase A):
    [4] Monitoring & Alerting  ← depends on [2]
    [5] Backup & Restore       ← depends on [2]
    [6] CDN Optimization       ← independent (parallel with 4, 5)

  Phase C (P1, after Phase B):
    [7] API Docs Portal        ← independent (parallel with 8)
    [8] Tenant Provisioning    ← depends on [1], [5]

  Phase D (P2, after Phase C):
    [9]  AI Safety Depth       ← independent
    [10] Zero-Downtime Deploy  ← depends on [4]

Batch 8 (after all Batch 7 merged)
  Phase A: [1] Migration Cleanup           ← independent
  Phase B: [2] SWR Data Fetching           ← independent
           [3] Shared UI Package           ← independent
           [4] Postgres FTS Depth          ← independent
           [5] Network Resilience          ← independent
  Phase C: [6] Gradebook Depth             ← independent
  Phase D: [7] Guardian Portal             ← depends on [B5] Batch 7 Security Audit
```

---

## Quick Reference: Spec Files for All Remaining Tasks

### Batch 7

| Spec File | Task |
|-----------|------|
| `CODEX_TASK_01_SECURITY_AUDIT.md` | Security Audit Final (detailed) |
| `CODEX_SECURITY_AUDIT_FINAL.md` | Security Audit Final (overview) |
| `CODEX_TASK_02_DATABASE_SCALING.md` | Database Scaling (detailed) |
| `CODEX_DATABASE_SCALING.md` | Database Scaling (overview) |
| `CODEX_E2E_REGRESSION_SUITE.md` | E2E Regression Suite |
| `CODEX_TASK_04_MONITORING_ALERTING.md` | Monitoring & Alerting (detailed) |
| `CODEX_MONITORING_ALERTING.md` | Monitoring & Alerting (overview) |
| `CODEX_TASK_03_BACKUP_RESTORE.md` | Backup & Restore Automation (detailed) |
| `CODEX_BACKUP_RESTORE_AUTOMATION.md` | Backup & Restore Automation (overview) |
| `CODEX_CDN_ASSET_OPTIMIZATION.md` | CDN & Asset Optimization |
| `CODEX_API_DOCUMENTATION_PORTAL.md` | API Documentation Portal |
| `CODEX_TASK_05_TENANT_PROVISIONING.md` | Tenant Provisioning (detailed) |
| `CODEX_TENANT_PROVISIONING.md` | Tenant Provisioning (overview) |
| `CODEX_TASK_06_AI_SAFETY.md` | AI Safety Depth (detailed) |
| `CODEX_AI_SAFETY_DEPTH.md` | AI Safety Depth (overview) |
| `CODEX_TASK_07_DEPLOY_INFRASTRUCTURE.md` | Deployment Zero Downtime (detailed) |
| `CODEX_DEPLOYMENT_ZERO_DOWNTIME.md` | Deployment Zero Downtime (overview) |

> **Note:** For tasks that have both a `CODEX_TASK_*` file and a `CODEX_*` overview file, the `CODEX_TASK_*` file contains the more detailed, actionable implementation instructions (exact code, file paths, Definition of Done). Use the `CODEX_TASK_*` file as primary and the overview file as supplementary context.

### Batch 8

| Spec File | Task |
|-----------|------|
| `CODEX_MIGRATION_CLEANUP.md` | Duplicate Migration Cleanup |
| `CODEX_SWR_DATA_FETCHING.md` | SWR Data Fetching Layer |
| `CODEX_SHARED_UI_PACKAGE.md` | Shared UI Package |
| `CODEX_POSTGRES_FULL_TEXT_SEARCH.md` | Postgres Full-Text Search Depth |
| `CODEX_NETWORK_RESILIENCE.md` | Network Resilience |
| `CODEX_GRADEBOOK_DEPTH.md` | Gradebook Depth |
| `CODEX_GUARDIAN_PORTAL.md` | Guardian Portal |

---

## What Is Already Complete

The following is fully implemented across all three services (Rails backend, Next.js frontend, FastAPI AI gateway):

- **All 7 PRD phases** (Foundation, Planning, LMS Core, Assessment, Google Integrations, AI Gateway, Institutional Hardening)
- **68 tenant-scoped Rails models** with full Pundit authorization (Wave 1 + Wave 2)
- **65+ API controllers** covering all product features
- **88 Next.js pages** across Plan, Teach, Learn, Assess, Report, Communicate, and Admin sections
- **Full Google integration** (Classroom sync, Drive picker, Workspace add-ons)
- **AI-assisted planning** with streaming, 4 task types (Draft, Differentiate, Assess, Rewrite), policy enforcement, apply-to-plan
- **Complete assessment engine** (question banks, quizzes, accommodations, QTI import/export, auto-grading)
- **Enterprise features** (FERPA/COPPA compliance, Postgres RLS on all tables, webhooks, PWA, student portfolio, version diff/history)
- **Test coverage** — backend 91%, frontend 63%, AI gateway 94%
- **CI/CD pipeline** (Railway, GitHub Actions, Sentry)

---

## What Batch 7 Adds

Upon Batch 7 completion, the platform gains:
- Final security audit and hardened posture
- Database optimized for multi-school concurrent load
- All 5 PRD workflows proven end-to-end
- Proactive monitoring and alerting
- Automated backup verification
- CDN-accelerated asset delivery
- API documentation for external integrators
- Automated school provisioning (no manual onboarding)
- ML-based AI content safety
- Zero-downtime deployment with rollback

**After Batch 7: platform is launch-ready for real school customers.**

## What Batch 8 Adds

Post-launch quality improvements:
- Clean migration history (no duplicate files)
- SWR-based data fetching (optimistic updates, caching, request deduplication)
- Centralized shared UI design system (packages/ui populated)
- Deep full-text search across all content types
- Offline resilience and network error recovery
- Advanced gradebook features
- Parent/guardian read-only portal

---

## Rules for Codex Execution

1. Always read `AGENTS.md` and `CLAUDE.md` at the project root before starting any task.
2. Always run the full test suite before starting a task to confirm green baseline.
3. Never start a task whose dependencies are not yet merged to `main`.
4. Never mark a task complete until its full Definition of Done checklist passes.
5. Do not invent features not listed in `PRD_K12_Planning_LMS_AI_Optimized.md`.
6. Every new model must include `TenantScoped` concern and an RLS migration.
7. Every new controller action must call `authorize` with a Pundit policy.
8. All tests must pass before committing. Do not push a broken build.
