# CODEX Batch 5 — Prioritized Execution Plan

**Date:** 2026-02-17
**Prerequisite:** All Batch 1–4 specs executed (41 total)
**Focus:** Production readiness, feature depth, teacher productivity, and platform expansion

---

## Completed Batches Summary

### Batch 1 (V0 Build) — 6 specs
Google Integrations, AI Gateway, Institutional Hardening, test fixes, coverage, gap analysis.

### Batch 2 (Feature + Quality) — 17 specs
Analytics, standards, SAML, streaming, LTI, accessibility, hardening, UX depth, testing, polish, CI/CD.

### Batch 3 (Hardening + Integration) — 7 specs
RBAC Wave 2, auth sessions, schema/CI fixes, AI product integration, contract expansion, add-on UX, E2E tests.

### Batch 4 (Architecture + Workflow) — 11 specs
Calendar API, lesson PDF, AI apply-to-plan, student progress, Postgres FTS, form library, SWR data fetching, E2E Playwright, OpenAPI sync, observability/runbooks, shared UI package.

---

## Superseded Specs (Do NOT Execute)

These older specs are fully superseded by Batch 4 work (`DATA_FETCHING_LAYER`, `SHARED_UI_EXTRACTION`, `SEARCH_DEPTH`, `OBSERVABILITY_RUNBOOKS`):

| Spec File | Superseded By | Reason |
|-----------|---------------|--------|
| CODEX_DATA_FETCHING_LAYER.md | CODEX_SWR_DATA_FETCHING | SWR installed and all pages migrated |
| CODEX_SHARED_UI_EXTRACTION.md | CODEX_SHARED_UI_PACKAGE | packages/ui populated with components |
| CODEX_SEARCH_DEPTH.md | CODEX_POSTGRES_FULL_TEXT_SEARCH | tsvector + GIN indexes + SearchService deployed |
| CODEX_OBSERVABILITY_RUNBOOKS.md | CODEX_OBSERVABILITY_AND_RUNBOOKS | Structured logging, metrics, runbooks all created |

---

## Batch 5 Execution Plan

### Execution Order and Dependencies

```
Phase A (P0, No Dependencies — Run First)
  1. CODEX_MIGRATION_CLEANUP           P0  Small   [no deps]
  2. CODEX_DATA_MODEL_RECONCILIATION   P0  Medium  [no deps]
  3. CODEX_GRADEBOOK_DEPTH             P0  Medium  [no deps]
  4. CODEX_NEXT_MIDDLEWARE_AUTH         P0  Small   [no deps]

Phase B (After Phase A Completes)
  5. CODEX_PRODUCTION_ENVIRONMENT      P1  Medium  [depends on #1]
  6. CODEX_PERFORMANCE_OPTIMIZATION    P1  Medium  [no deps]
  7. CODEX_NOTIFICATION_CHANNELS       P1  Medium  [no deps]
  8. CODEX_NETWORK_RESILIENCE          P1  Small   [leverages SWR — NEW]

Phase C (After Phase B Completes)
  9. CODEX_DRIVE_INTEGRATION_DEPTH     P1  Medium  [no deps]
 10. CODEX_BULK_OPERATIONS             P2  Medium  [NEW]
 11. CODEX_ONBOARDING_WALKTHROUGH      P2  Small   [NEW]

Phase D (After Phase A Item #2 Completes)
 12. CODEX_GUARDIAN_PORTAL             P2  Large   [depends on #2]
 13. CODEX_ACADEMIC_YEAR_ROLLOVER      P2  Medium  [NEW]
 14. CODEX_WORKFLOW_VALIDATION         P2  Medium  [no deps]
 15. CODEX_DISTRICT_ADMIN_MULTI_SCHOOL P3  Large   [depends on #2]
```

---

### Phase A — P0 Foundation (Run First, Parallelizable)

| # | Spec | Priority | Effort | Why Now |
|---|------|----------|--------|---------|
| 1 | CODEX_MIGRATION_CLEANUP | P0 | Small (1–2h) | 7 duplicate migrations clutter schema; blocks production env work |
| 2 | CODEX_DATA_MODEL_RECONCILIATION | P0 | Medium (6–8h) | 3 missing tables from TECH_SPEC §2.4: permissions, guardian_links, question_versions |
| 3 | CODEX_GRADEBOOK_DEPTH | P0 | Medium (8–10h) | Gradebook is 22 lines; PRD-18 requires grade aggregation, mastery, CSV export |
| 4 | CODEX_NEXT_MIDDLEWARE_AUTH | P0 | Small (3–4h) | No server-side route protection; unauthenticated content flashes |

**Parallelization:** Items 1–4 have no interdependencies. All 4 can execute simultaneously.

---

### Phase B — P1 Production Quality

| # | Spec | Priority | Effort | Why Now |
|---|------|----------|--------|---------|
| 5 | CODEX_PRODUCTION_ENVIRONMENT | P1 | Medium (6–8h) | Encryption keys unprovisioned, no production seed, backup not automated |
| 6 | CODEX_PERFORMANCE_OPTIMIZATION | P1 | Medium (6–8h) | No N+1 detection, no counter caches, no eager loading optimization |
| 7 | CODEX_NOTIFICATION_CHANNELS | P1 | Medium (6–8h) | Notifications are in-app only; no email delivery, no preferences, no digests |
| 8 | CODEX_NETWORK_RESILIENCE | P1 | Small (3–4h) | No offline detection, no retry UI, no network error handling **(NEW)** |

**Parallelization:** Items 5–8 can run in parallel. Item 5 depends on #1 completing first.

---

### Phase C — P1/P2 Feature Depth

| # | Spec | Priority | Effort | Why Now |
|---|------|----------|--------|---------|
| 9 | CODEX_DRIVE_INTEGRATION_DEPTH | P1 | Medium (6–8h) | Drive service is 41 lines; no sharing, folders, copying, or distribution |
| 10 | CODEX_BULK_OPERATIONS | P2 | Medium (6–8h) | No bulk grading, CSV import, or batch publish for teachers/admins **(NEW)** |
| 11 | CODEX_ONBOARDING_WALKTHROUGH | P2 | Small (3–4h) | PRD-8 targets time-to-first-unit < 20 min; no guided onboarding exists **(NEW)** |

---

### Phase D — P2/P3 Platform Expansion

| # | Spec | Priority | Effort | Why Now |
|---|------|----------|--------|---------|
| 12 | CODEX_GUARDIAN_PORTAL | P2 | Large (12–16h) | PRD-4 secondary user; now unlocked by data model reconciliation + progress reports |
| 13 | CODEX_ACADEMIC_YEAR_ROLLOVER | P2 | Medium (6–8h) | No year-end operations: archiving, term creation, enrollment reset **(NEW)** |
| 14 | CODEX_WORKFLOW_VALIDATION | P2 | Medium (6–8h) | Backend workflow tests for PRD-17/18/19/21 key journeys |
| 15 | CODEX_DISTRICT_ADMIN_MULTI_SCHOOL | P3 | Large (10–14h) | PRD-4 secondary user; depends on data model reconciliation |

---

## New Spec Files Created for Batch 5

| File | Focus | Status |
|------|-------|--------|
| CODEX_NETWORK_RESILIENCE.md | Offline detection, retry logic, error UI | NEW |
| CODEX_BULK_OPERATIONS.md | Bulk grading, CSV import/export, batch actions | NEW |
| CODEX_ONBOARDING_WALKTHROUGH.md | Guided first-time teacher setup | NEW |
| CODEX_ACADEMIC_YEAR_ROLLOVER.md | End-of-year operations and term transitions | NEW |

---

## Total Effort Estimate

| Phase | Specs | Estimated Hours |
|-------|-------|-----------------|
| A | 4 | 18–24h |
| B | 4 | 21–28h |
| C | 3 | 15–20h |
| D | 4 | 36–46h |
| **Total** | **15** | **90–118h** |

---

## Key Context for Codex Execution

After Batch 4, the codebase now has:
- **SWR data fetching** — All pages use `useSWR` hooks; new pages should follow this pattern
- **Shared UI package** — `@k12/ui` has Button, Input, Modal, etc.; new pages should import from `@k12/ui`
- **Form library** — `apps/web/src/components/forms/` has FormField, TextInput, Select, etc.
- **E2E Playwright** — `apps/web/e2e/` has test infrastructure; new features should add E2E tests
- **Full-text search** — Postgres FTS with tsvector + GIN indexes on 6 tables
- **Observability** — Structured JSON logging, MetricsService, job instrumentation, runbooks
- **OpenAPI** — All ~100 endpoints documented in `core-v1.openapi.yaml`

New specs should leverage these patterns rather than reimplementing them.
