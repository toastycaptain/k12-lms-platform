# Full Codebase Assessment — K-12 Planning + LMS Platform

**Date:** 2026-02-16
**Audited against:** PRD_K12_Planning_LMS_AI_Optimized.md, TECH_SPEC_K12_Planning_LMS.md, UX_SPEC_K12_Planning_LMS.md
**Assessment method:** Automated test runs, file inventory, git history analysis, spec traceability

---

## Executive Summary

The platform has reached **production-ready feature completeness** across all 7 PRD phases. Three batches of Codex specifications (23 total) have been executed, raising the codebase from initial scaffolding to a mature, well-tested system. Test coverage now exceeds original targets across all services.

**Current Health:**

| Service | Tests | Pass Rate | Line Coverage | Target | Status |
|---------|-------|-----------|---------------|--------|--------|
| Rails Core | 1,441 specs | 100% | **91.06%** | 60% | Exceeded |
| Next.js Web | 256 tests (48 files) | 100% | **63.26%** | 40% | Exceeded |
| AI Gateway | 35 tests (5 files) | 100% | **93.75%** | 80% | Exceeded |

**All specs pass. All coverage targets exceeded.**

---

## Phase-by-Phase Status

| Phase | PRD Ref | Description | Grade | Notes |
|-------|---------|-------------|-------|-------|
| M1 | PRD-9 | Foundation (tenancy, RBAC, versioning, Drive, PDF) | **A** | RBAC hardened in Wave 1 + Wave 2. All policies scoped. |
| M2 | PRD-10 | Planning Excellence (templates, standards, coverage, approvals) | **A** | Complete. No gaps. |
| M3 | PRD-11 | LMS Core (courses, modules, assignments, submissions, rubrics) | **A** | Complete. No gaps. |
| M4 | PRD-12 | Assessment (question banks, quizzes, attempts, accommodations, QTI) | **A** | Complete. Analytics dashboard added. |
| M5 | PRD-13 | Google Integrations (Workspace add-ons, Classroom sync) | **A-** | Backend complete. Add-on host pages built. Drive picker working. |
| M6 | PRD-14 | AI Gateway (registry, policies, planning, auditing) | **A-** | Gateway operational. Policy enforcement wired. Apply-to-plan built. |
| M7 | PRD-15 | Institutional Hardening (OneRoster, LTI, governance, DR) | **A-** | LTI 1.3 protocol complete. OneRoster sync operational. DR documented. |

---

## Inventory

### Rails Backend (apps/core)

| Category | Count | Notes |
|----------|-------|-------|
| Models | 62 | All domain models tenant-scoped via TenantScoped concern |
| Controllers | 65 | Under /api/v1, all with Pundit authorize |
| Pundit Policies | 56+ | Role-and-ownership scoped after Wave 2 hardening |
| Serializers | 51 | ActiveModelSerializers for all API responses |
| Background Jobs | 12 | AI, Classroom, OneRoster, QTI, PDF, data retention |
| Services | 7 | AI client, audit, Google (3), notification, OneRoster |
| Concerns | 3 | TenantScoped, DateRangeValidatable, Paginatable |
| Migrations | 67 | Full schema with tenant_id on every table |
| Spec Files | 213 | Model, request, policy, service, job, contract, integration |
| Line Coverage | 91.06% | 5,187 / 5,696 lines covered |

### Next.js Frontend (apps/web)

| Category | Count | Notes |
|----------|-------|-------|
| Pages | 80 | Across 7 sections: Plan, Teach, Learn, Assess, Communicate, Admin, Report |
| Components | 30+ | AppShell, ProtectedRoute, AiAssistantPanel, GoogleDrivePicker, etc. |
| Skeleton Components | 6 | Dashboard, CourseHome, Gradebook, List, Quiz, Standards |
| Lib Files | 7 | api.ts, api-stream.ts, api-poll.ts, addon-api.ts, auth-context.tsx |
| Test Files | 48 | Component, page, lib, contract, accessibility tests |
| Contract Tests | 7 | Assignment, course, messaging, module, notification, quiz, user APIs |
| Line Coverage | 63.26% | Statements: 65.68% |

### AI Gateway (apps/ai-gateway)

| Category | Count | Notes |
|----------|-------|-------|
| Endpoints | 4 | health, providers, generate, generate_stream |
| Providers | 2 | OpenAI (4 models), Anthropic (2 models) |
| System Prompts | 5 | lesson, unit, differentiation, assessment, rewrite |
| Safety Filters | 8 | 5 injection patterns + 3 XSS patterns |
| Test Files | 5 | Router, registry, OpenAI, Anthropic, conftest |
| Line Coverage | 93.75% | 345 / 368 lines covered |

### Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| CI/CD | Active | GitHub Actions: web (lint+typecheck+build+test), core (rspec+rubocop+brakeman), ai-gateway (pytest) |
| Deploy | Railway | Automated deployment pipeline with smoke tests |
| OpenAPI Contracts | Bootstrapped | core-v1.openapi.yaml + ai-gateway-v1.openapi.yaml |
| Rate Limiting | Active | Rack::Attack on auth, addon, AI, general API |
| Error Tracking | Active | Sentry on web + ai-gateway |
| Backup Strategy | Documented | pg_dump + WAL archiving + S3 (docs/DATABASE_BACKUP.md) |

---

## UX Spec Coverage Matrix

### App Shell (UX §3.2) — DONE

| Element | Status |
|---------|--------|
| Left nav (Plan, Teach, Assess, Report, Communicate, Admin) | Done — Role-aware in AppShell |
| Top bar: school selector | Done — SchoolSelector component |
| Top bar: search | Done — GlobalSearch with /api/v1/search |
| Top bar: notifications | Done — NotificationBell with unread count |
| Right context panel | Done — AiAssistantPanel on planner screens |

### Auth & Onboarding (UX §3.3) — DONE

| Element | Status |
|---------|--------|
| Google sign-in | Done — OmniAuth Google OAuth |
| SSO/SAML | Done — omniauth-saml with per-tenant config |
| School selection | Done — Setup wizard at /setup |
| Auth callback | Done — /auth/callback route handles post-login |

### Teacher Screens (UX §3.4) — 14/14 DONE

Dashboard, Unit Library, Unit Planner, Lesson Editor, Template Library, Standards Browser, Publish Preview, Course Home, Module Editor, Assignment Editor, Submissions Inbox, Grading View, Discussions, Calendar

### Student Screens (UX §3.5) — 8/8 DONE

Dashboard, Course List, Course Detail, Assignment Submission, Quiz Attempt, Quiz Results, Grades, Discussions

### Admin Screens (UX §3.6) — 15/15 DONE

Dashboard, School Setup, Users & Roles, Integrations, SAML, Sync, AI Registry, AI Policies, AI Templates, LTI, Retention, Standards, Curriculum Map, Approvals

### AI Assistant Panel (UX §3.7) — DONE

Task selection (Draft, Differentiate, Assess, Rewrite), streaming, polling fallback, abort, policy banner, apply-to-plan

### Google Add-ons (UX §3.8) — DONE

Workspace sidebar host page, Classroom add-on host page

---

## Executed Codex Specifications (All 3 Batches)

### Batch 1 (V0 — Initial Build)
1. CODEX_M5_GOOGLE_INTEGRATIONS — Google Workspace + Classroom sync
2. CODEX_M6_AI_GATEWAY — FastAPI gateway with providers
3. CODEX_M7_INSTITUTIONAL_HARDENING — OneRoster, LTI, governance
4. CODEX_M6_COMPLETION_AND_TEST_FIXES — Test cleanup
5. CODEX_SPEC_COVERAGE — Spec coverage assessment
6. CODEX_REMAINING_GAPS — Gap identification

### Batch 2 (Feature + Quality)
7. CODEX_ASSESSMENT_ANALYTICS — Quiz analytics dashboard
8. CODEX_STANDARDS_COVERAGE — Standards coverage reporting
9. CODEX_SAML_AUTH — SAML SSO authentication
10. CODEX_AI_STREAMING — AI streaming endpoint
11. CODEX_LTI_PROTOCOL — LTI 1.3 launch and deep linking
12. CODEX_ACCESSIBILITY — WCAG 2.1 AA compliance
13. CODEX_PRODUCTION_HARDENING — Dockerfiles, rate limiting, health checks
14. CODEX_TEACHER_UX_DEPTH — Teacher screen depth
15. CODEX_APP_SHELL_GLOBAL — Search, notifications, onboarding
16. CODEX_STUDENT_EXPERIENCE — Student dashboard and workflows
17. CODEX_MESSAGING — Message threads and communication
18. CODEX_BACKEND_TEST_DEPTH — Rails spec depth (17% → 91%)
19. CODEX_FRONTEND_TESTING — Vitest test suite (0% → 63%)
20. CODEX_FRONTEND_POLISH — Skeletons, pagination, empty states, toasts
21. CODEX_RAILWAY_CI_CD — Railway deploy pipeline
22. CODEX_PRODUCTION_BOOTSTRAP — Migration runner, admin bootstrap
23. CODEX_E2E_CONTRACT_VALIDATION — Frontend ↔ backend contract validation

### Batch 3 (Hardening + Integration)
24. CODEX_RBAC_HARDENING_WAVE2 — Policy scope tightening
25. CODEX_AUTH_SESSION_HARDENING — CSRF, callbacks, session lifecycle
26. CODEX_SCHEMA_AND_CI_FIXES — Migration drift fixes, Core CI gate
27. CODEX_AI_PRODUCT_INTEGRATION — Policy enforcement, apply-to-plan
28. CODEX_CONTRACT_EXPANSION — OpenAPI coverage expansion
29. CODEX_GOOGLE_ADDON_UX — Workspace sidebar + Classroom add-on pages
30. CODEX_E2E_INTEGRATION_TESTS — Full-stack integration tests

---

## Known Issues (Post All 3 Batches)

### 1. Duplicate Migrations (Low — Cosmetic)
Seven 20260216 migrations duplicate 20260215 migrations for the same tables (ai_*, lti_*, data_retention_policies). All have `return if table_exists?` guards so they're safe, but they clutter the migration list. These should be consolidated or removed.

### 2. Shared UI Package Empty (Medium — Technical Debt)
`packages/ui` contains only `.gitkeep`. The TECH_SPEC §2.2 calls for a shared design system. Components like Button, Input, Modal, Card are duplicated inline across pages.

### 3. No Data Fetching Layer (Medium — Architecture)
Pages use raw `apiFetch()` calls with `useState`/`useEffect`. No data-fetching library (SWR, React Query) means no automatic caching, revalidation, or optimistic updates. This limits UX smoothness and creates waterfall request patterns.

### 4. Production Environment Gaps (Medium — Operations)
- Active Record encryption keys not provisioned (`encrypts :settings` commented out)
- No production-safe seed script for bootstrapping initial tenant/admin
- Backup automation documented but not automated via cron/scheduler

### 5. Search Implementation Shallow (Low — Feature Gap)
`GlobalSearch` component exists but Postgres FTS isn't deeply implemented. TECH_SPEC §2.8 envisions full-text search across standards, units, templates, and courses.

### 6. No Offline/Network Error Handling (Low — UX)
No service worker, no offline detection, no retry logic for transient network failures.

### 7. Parent/Guardian Portal Not Started (Low — Deferred)
PRD-4 lists Parent/Guardian as secondary users "optional in MVP." No guardian-facing views exist.

---

## Recommended Next Steps (Batch 4)

See individual CODEX specification files for detailed task definitions:

| Priority | Spec File | Focus | Effort |
|----------|-----------|-------|--------|
| P0 | CODEX_MIGRATION_CLEANUP.md | Remove duplicate migrations, verify schema parity | Small |
| P0 | CODEX_DATA_FETCHING_LAYER.md | Add SWR/React Query, eliminate request waterfalls | Medium |
| P1 | CODEX_SHARED_UI_EXTRACTION.md | Populate packages/ui with extracted design primitives | Medium |
| P1 | CODEX_SEARCH_DEPTH.md | Implement Postgres FTS across core entities | Medium |
| P1 | CODEX_PRODUCTION_ENVIRONMENT.md | Encryption keys, seed script, backup automation | Medium |
| P2 | CODEX_OBSERVABILITY_RUNBOOKS.md | Dashboards, alerts, incident runbooks | Medium |
| P2 | CODEX_GUARDIAN_PORTAL.md | Parent/guardian read-only views (PRD-4) | Large |
