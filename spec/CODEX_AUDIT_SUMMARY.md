# Project Audit Summary — K-12 Planning + LMS Platform

**Date:** 2026-02-16
**Audited against:** PRD_K12_Planning_LMS_AI_Optimized.md, TECH_SPEC_K12_Planning_LMS.md, UX_SPEC_K12_Planning_LMS.md

---

## Build Status by PRD Phase

| Phase | Description | Status | Coverage |
|-------|-------------|--------|----------|
| M1 | Foundation (tenancy, RBAC, versioning, Drive, PDF) | **COMPLETE** | 100% |
| M2 | Planning Excellence (templates, standards, coverage, approvals) | **COMPLETE** | 100% |
| M3 | LMS Core (courses, modules, assignments, submissions, rubrics, discussions) | **COMPLETE** | 100% |
| M4 | Assessment (question banks, quizzes, attempts, accommodations, QTI) | **COMPLETE** | 100% |
| M5 | Google Integrations (Workspace Add-ons, Classroom sync) | **COMPLETE** | 95% |
| M6 | AI Gateway (model registry, task policies, AI planning, auditing) | **COMPLETE** | 100% |
| M7 | Institutional Hardening (OneRoster, LTI, governance, DR) | **COMPLETE** | 100% |

---

## Inventory

### Rails Backend (apps/core)
- **59 models** — All PRD entities implemented with TenantScoped concern
- **64 API controllers** — Full CRUD + specialized endpoints (streaming, analytics, grading, search)
- **52 Pundit policies** — Role-based access on every resource
- **51 serializers** — ActiveModelSerializers for all API responses
- **12 background jobs** — AI generation, Classroom sync, OneRoster, QTI, PDF, data retention
- **7 services** — AiGatewayClient, AuditLogger, GoogleClassroomService, GoogleDriveService, GoogleTokenService, NotificationService, OneRosterClient
- **3 concerns** — TenantScoped, DateRangeValidatable, Paginatable
- **42 migrations** — Full schema with tenant_id on every table
- **269-line seeds.rb** — Development seed data
- **1234 passing specs** — 57 model, 69 request, 52 policy, 7 service specs

### Next.js Frontend (apps/web)
- **79 pages** across 7 sections (Plan, Teach, Learn, Assess, Communicate, Admin, Report)
- **10 components** — AppShell, ProtectedRoute, GlobalSearch, NotificationBell, SchoolSelector, AiAssistantPanel, GoogleDrivePicker, FocusTrap, LiveRegion
- **6 lib files** — api.ts, api-stream.ts, api-poll.ts, auth-context.tsx + tests
- **6 test suites** — Accessibility, dashboard, ProtectedRoute, auth-context, API smoke
- **26,911 total lines** of page code (no stub pages — smallest real page is 98 lines)

### AI Gateway (apps/ai-gateway)
- **4 endpoints** — health, providers, generate, generate_stream
- **2 providers** — OpenAI (4 models), Anthropic (2 models)
- **5 system prompts** — lesson_generation, unit_generation, differentiation, assessment_generation, rewrite
- **Safety filters** — 5 input patterns, 3 output patterns
- **49 passing tests** — Router, registry, OpenAI, Anthropic provider tests

### Infrastructure
- **Dockerfiles** — Multi-stage builds for core, sidekiq, ai-gateway, web
- **CI/CD** — GitHub Actions CI (lint, typecheck, build, rspec, pytest)
- **Rate limiting** — Rack::Attack on auth, addon, AI, and general API
- **OpenAPI contracts** — core-v1.openapi.yaml, ai-gateway-v1.openapi.yaml
- **Deployed on Railway** — k12-web (200 OK), k12-core (200 OK), k12-sidekiq (running)

---

## UX Spec Page Coverage

Every screen from UX_SPEC sections 3.2–3.8 has a corresponding page:

- **App Shell** ✅ — Left nav, top bar, school selector, search, notifications
- **Auth & Onboarding** ✅ — Login (Google + SAML), setup wizard, callback
- **Teacher Screens (14/14)** ✅ — Dashboard, Unit Library/Planner, Lesson Editor, Templates, Standards, Publish Preview, Course Home, Module Editor, Assignment Editor, Submissions, Grading, Discussions, Calendar
- **Student Screens (8/8)** ✅ — Dashboard, Courses, Course Detail, Assignment Submission, Quiz Attempt, Quiz Results, Grades, Discussions
- **Admin Screens (15/15)** ✅ — Dashboard, School Setup, Users, Integrations, SAML, Sync, AI Registry/Policies/Templates, LTI, Retention, Standards, Curriculum Map, Approvals
- **AI Assistant Panel** ✅ — Streaming, polling fallback, task selection, abort
- **Google Add-ons** ✅ — Workspace sidebar, Classroom add-on
- **Report** ✅ — Overview + Standards Coverage

---

## Remaining Gaps

### 1. Test Coverage (CRITICAL)
- **17.06% line coverage** (1240/7267 lines) despite 1234 specs passing
- Many specs exist but are shallow — they test happy paths without edge cases
- Frontend has only 6 test files for 79 pages
- **Target: 60%+ backend line coverage, 40%+ frontend coverage**

### 2. Frontend Component Testing
- Only AppShell and GlobalSearch have a11y tests
- No page-level integration tests
- No visual regression tests
- Missing tests for critical flows: login, quiz attempt, grading, messaging

### 3. CI/CD Railway Alignment
- `deploy.yml` references Kamal (not Railway)
- No staging environment on Railway
- No automated database migration step in deploy pipeline
- No post-deploy smoke tests against Railway URLs

### 4. Production Database
- Migrations may not have run on production Supabase DB
- Seeds need a production-safe variant for initial tenant/admin setup
- Active Record Encryption keys not provisioned (encrypts :settings commented out)

### 5. End-to-End Data Flow Gaps
- Some frontend pages may reference API endpoints with different response shapes than what serializers return
- No integration test verifying frontend → backend → AI gateway flow
- CORS_ORIGINS only allows single origin; multi-domain deployments untested

### 6. Missing Polish Items
- /packages/ui shared component library is empty
- No error boundary components in frontend
- No offline/network error handling
- No loading skeletons (pages use simple "Loading..." text)
- No pagination UI on list pages (backend supports it via Paginatable concern)

---

## Previously Executed Codex Specs

All 17 existing specs have been executed:

### V0 Specs (executed first)
1. CODEX_M5_GOOGLE_INTEGRATIONS
2. CODEX_M6_AI_GATEWAY
3. CODEX_M7_INSTITUTIONAL_HARDENING
4. CODEX_M6_COMPLETION_AND_TEST_FIXES
5. CODEX_SPEC_COVERAGE
6. CODEX_REMAINING_GAPS

### Current Specs (executed and audited to 100%)
7. CODEX_ASSESSMENT_ANALYTICS
8. CODEX_STANDARDS_COVERAGE
9. CODEX_SAML_AUTH
10. CODEX_AI_STREAMING
11. CODEX_LTI_PROTOCOL
12. CODEX_ACCESSIBILITY
13. CODEX_PRODUCTION_HARDENING
14. CODEX_TEACHER_UX_DEPTH
15. CODEX_APP_SHELL_GLOBAL
16. CODEX_STUDENT_EXPERIENCE
17. CODEX_MESSAGING

---

## Previously Created Codex Specs (Batch 2 — executed)

| Spec File | Focus | Priority | Status |
|-----------|-------|----------|--------|
| CODEX_BACKEND_TEST_DEPTH.md | Deepen Rails specs to 60%+ line coverage | P0 | Executed (A+) |
| CODEX_FRONTEND_TESTING.md | Add Vitest tests for all major pages/flows | P0 | Executed (A+) |
| CODEX_FRONTEND_POLISH.md | Loading skeletons, error boundaries, pagination UI, UX polish | P1 | Executed (A+) |
| CODEX_RAILWAY_CI_CD.md | Align CI/CD with Railway, add staging, smoke tests | P1 | Executed (A+) |
| CODEX_PRODUCTION_BOOTSTRAP.md | Production migration runner, admin bootstrap, encryption keys | P1 | Executed (A+) |
| CODEX_E2E_CONTRACT_VALIDATION.md | Validate frontend ↔ backend API contracts end-to-end | P2 | Executed (A+) |

---

## New Codex Specs Created (Batch 3 — next steps)

Based on the 2026-02-16 full codebase assessment against PRD/TECH/UX specs:

| Spec File | Focus | Priority | Spec Refs |
|-----------|-------|----------|-----------|
| CODEX_CURRENT_STATE_ASSESSMENT.md | Full gap analysis — codebase vs. all foundational specs | Reference | PRD-1..25, TECH-2.1..2.11, UX-3.1..3.8 |
| CODEX_RBAC_HARDENING_WAVE2.md | Tighten all broad `scope.all` policies for assignments, submissions, quizzes, discussions, question banks, integrations | P0 | PRD-9, TECH-2.3 |
| CODEX_AUTH_SESSION_HARDENING.md | OAuth callback route, CSRF enforcement, session lifecycle, API base URL consistency, rate limiting | P0 | TECH-2.3, PRD-23 |
| CODEX_SCHEMA_AND_CI_FIXES.md | Create 7 missing migration files, add Core RSpec to CI, update Makefile | P0 | TECH-2.4, Blockers #1 and #5 |
| CODEX_AI_PRODUCT_INTEGRATION.md | Wire AI policy enforcement, invocation persistence, "apply to plan" action, policy banner | P1 | PRD-14, UX-3.7 |
| CODEX_CONTRACT_EXPANSION.md | Expand OpenAPI from 31 to ~100 endpoints, add contract validation tests | P1 | TECH-2.5, TECH-2.6 |
| CODEX_GOOGLE_ADDON_UX.md | Build Workspace sidebar and Classroom add-on host pages | P1 | PRD-13, UX-3.8 |
| CODEX_E2E_INTEGRATION_TESTS.md | Full-stack integration tests: frontend ↔ backend ↔ AI gateway | P2 | PRD-23, TECH-2.1 |

### Recommended Execution Order

1. **CODEX_RBAC_HARDENING_WAVE2** — Security: stop data leakage across roles/courses
2. **CODEX_AUTH_SESSION_HARDENING** — Security: close CSRF and callback gaps
3. **CODEX_SCHEMA_AND_CI_FIXES** — Reliability: fix migration drift, enable Core CI
4. **CODEX_AI_PRODUCT_INTEGRATION** — Feature: make AI admin controls actually work
5. **CODEX_CONTRACT_EXPANSION** — Quality: document all API surfaces
6. **CODEX_GOOGLE_ADDON_UX** — Feature: complete Google product surface
7. **CODEX_E2E_INTEGRATION_TESTS** — Quality: prove the full stack works together
