# Current State Assessment — K-12 Planning + LMS Platform

**Date:** 2026-02-16
**Assessed against:** PRD_K12_Planning_LMS_AI_Optimized.md, TECH_SPEC_K12_Planning_LMS.md, UX_SPEC_K12_Planning_LMS.md

---

## Executive Summary

The platform has achieved broad feature coverage across all 7 PRD phases. The backend (60 models, 64 controllers, 56 policies, 210 spec files) and frontend (104 pages, 30 components, 47 test files) are functionally complete for the core product surface. The AI gateway is fully operational with 2 providers. However, several critical gaps remain between the spec vision and the shipped product — primarily around **security hardening**, **AI product integration**, **end-to-end data flow verification**, and **test depth**.

---

## Phase-by-Phase Assessment

### Phase 1 — Foundation (PRD-9) | Grade: A-

| Requirement | Status | Evidence | Gap |
|-------------|--------|----------|-----|
| Multi-tenancy | DONE | TenantScoped concern on all 58 domain models, `Current.tenant` in ApplicationController | None |
| RBAC | PARTIAL | 56 Pundit policies exist; however many use broad `scope.all` — only Course, Enrollment, UnitPlan policies are hardened | Wave 2 RBAC hardening needed for Assignment, Submission, Quiz, Discussion, QuestionBank, IntegrationConfig policies |
| Unit/Lesson versioning | DONE | UnitPlan → UnitVersion, LessonPlan → LessonVersion with `current_version_id`, `create_version` actions | None |
| Drive attachments | DONE | DriveController (picker_token, create_document, create_presentation), GoogleDrivePicker component | None |
| PDF export | DONE | PdfExportJob, export_pdf/export_pdf_status actions on UnitPlansController | None |

**Key Gap:** RBAC policies need scope tightening (P0-4 in PRIORITIZED_BACKLOG).

---

### Phase 2 — Planning Excellence (PRD-10) | Grade: A

| Requirement | Status | Evidence | Gap |
|-------------|--------|----------|-----|
| Templates | DONE | Template/TemplateVersion models, CRUD + create_unit + publish/archive, Template Library page | None |
| Standards alignment | DONE | UnitVersionStandards, TemplateVersionStandards, AssignmentStandards controllers + UI | None |
| Coverage reporting | DONE | StandardsCoverageController (by_academic_year, by_course), Curriculum Map page | None |
| Optional approvals | DONE | Approval model (polymorphic), ApprovalsController (approve/reject), Admin Approvals page | None |

**No critical gaps.**

---

### Phase 3 — LMS Core (PRD-11) | Grade: A

| Requirement | Status | Evidence | Gap |
|-------------|--------|----------|-----|
| Courses and modules | DONE | Course, CourseModule, ModuleItem models + CRUD + publish/archive/reorder | None |
| Assignments and submissions | DONE | Assignment (publish/close/push_to_classroom), Submission (grade/return) + rubric scoring | None |
| Rubrics and discussions | DONE | Rubric → RubricCriteria → RubricRatings → RubricScores full chain; Discussion + DiscussionPosts with lock/unlock | None |

**No critical gaps.**

---

### Phase 4 — Assessment (PRD-12) | Grade: A

| Requirement | Status | Evidence | Gap |
|-------------|--------|----------|-----|
| Question banks | DONE | QuestionBank model + CRUD + archive | None |
| Quizzes and attempts | DONE | Quiz → QuizItem → QuizAttempt → AttemptAnswer full lifecycle; auto-grading, time limits, shuffle | None |
| Accommodations | DONE | QuizAccommodation model (extra_time_minutes, extra_attempts); UI in quiz builder | None |
| QTI import/export | DONE | QtiImportJob, QtiExportJob; import_qti/export_qti actions on QuestionBanksController | None |

**No critical gaps.**

---

### Phase 5 — Google Integrations (PRD-13) | Grade: B

| Requirement | Status | Evidence | Gap |
|-------------|--------|----------|-----|
| Workspace Add-ons | PARTIAL | AddonController exists with unit_plans, lessons, standards, templates, ai_generate, attach, me endpoints | Add-on sidebar UX for Docs/Slides is backend-complete but frontend product surface is thin |
| Classroom sync | DONE | ClassroomCourseSyncJob, ClassroomRosterSyncJob, ClassroomGradePassbackJob, ClassroomCourseworkPushJob | None |

**Key Gap:** Google Workspace Add-on sidebar is an API shell; UX spec §3.8 envisions a full sidebar experience embedded in Docs/Slides. The frontend does not yet have a standalone add-on host page. Classroom add-on assignment flow is similarly API-only.

---

### Phase 6 — AI Gateway (PRD-14) | Grade: B-

| Requirement | Status | Evidence | Gap |
|-------------|--------|----------|-----|
| Admin model registry | PARTIAL | AiProviderConfigsController CRUD + activate/deactivate exist; Admin UI at `/admin/ai` renders provider configs | Admin can manage configs, but there is no end-to-end verification that the Rails-managed config actually drives gateway provider selection |
| Task policies | PARTIAL | AiTaskPoliciesController CRUD exists; Admin UI at `/admin/ai/policies` renders toggle switches | Policy enforcement on the generation path is not wired — the gateway does not check Rails policies before generating |
| AI-assisted planning | PARTIAL | AiAssistantPanel component exists on Unit/Lesson/Template editors; AiStreamController + AiInvocationsController exist | Streaming works gateway-to-frontend; but invocation persistence (logging who ran what, token usage) is not verified end-to-end |
| Auditing | PARTIAL | AiInvocation model tracks task_type, provider, tokens, status; AuditLogger service exists | AI invocations are created but the complete flow (create → run → complete! with token counts) has no integration test |

**Key Gaps:**
1. Policy enforcement: Gateway generates freely regardless of Rails-side AiTaskPolicy settings
2. End-to-end persistence: AI invocation lifecycle (pending → running → completed) not verified
3. Safety: Gateway uses basic regex filters — no ML-based content safety
4. Admin UX: Provider config management exists but model/temperature overrides from policies aren't enforced

---

### Phase 7 — Institutional Hardening (PRD-15) | Grade: B-

| Requirement | Status | Evidence | Gap |
|-------------|--------|----------|-----|
| OneRoster | DONE (API) | IntegrationConfigsController with sync_courses/sync_organizations/sync_users; OneRosterOrgSyncJob, OneRosterUserSyncJob; OneRosterClient service | Jobs and client exist but there are no integration tests against a real or mock OneRoster endpoint |
| LTI (optional) | DONE (API) | LtiRegistrationsController CRUD + activate/deactivate; LtiResourceLinksController; LTI 1.3 routes (oidc_login, launch, jwks) | LTI protocol flow (OIDC login → launch → deep linking) has no end-to-end test |
| Governance and DR | PARTIAL | DataRetentionPolicy model + controller + DataRetentionEnforcementJob; AuditLog model + AuditLogger service | Data retention enforcement not tested at scale; no backup/restore automation; encryption keys not provisioned |

**Key Gaps:**
1. No integration tests for OneRoster sync against external systems
2. LTI 1.3 protocol flow untested end-to-end
3. Data retention enforcement job needs production verification
4. Active Record encryption (`encrypts :settings`) is commented out — keys not provisioned

---

## Cross-Cutting Concerns

### Authentication & Session Management (TECH-2.3)

| Area | Status | Gap |
|------|--------|-----|
| Google OIDC | DONE | OmniAuth Google callback implemented |
| SAML | DONE | omniauth-saml + SamlController with metadata |
| Session cookies | DONE | `_k12_lms_session` cookie-based auth |
| CSRF protection | **GAP** | Cookie auth is active but CSRF token enforcement on state-changing API endpoints is not verified |
| OAuth callback route | **GAP** | Web app `/auth/callback` route may not exist (P0-1 in backlog) |

### API Contract Alignment (TECH-2.5)

| Area | Status | Gap |
|------|--------|-----|
| Core OpenAPI spec | PARTIAL | 31 endpoints documented in core-v1.openapi.yaml; actual routes define 100+ endpoints | ~70 active endpoints have no contract documentation |
| AI Gateway spec | DONE | All 4 endpoints documented in ai-gateway-v1.openapi.yaml |
| Contract testing | PARTIAL | 3 contract spec files exist but coverage is narrow |

### Test Depth (PRD-23)

| Layer | Current | Target | Gap |
|-------|---------|--------|-----|
| Backend specs | 210 files, ~1234 specs | 60%+ line coverage | Line coverage was 17% — recent work improved this but many specs are shallow (happy-path only) |
| Frontend tests | 47 test files, 232 tests | Page-level coverage for all critical flows | Recent work added tests for polish components + page skeletons; still missing: login flow, quiz attempt, grading, messaging integration tests |
| AI Gateway tests | 5 files, 49+ tests | 80%+ coverage | Good coverage; edge cases for streaming errors and safety filter bypass need expansion |
| E2E/integration | 3 contract specs | Frontend → Backend → AI Gateway verified | No true end-to-end test exists |

### Frontend Polish (UX-3.1)

| Area | Status | Gap |
|------|--------|-----|
| Loading skeletons | DONE | 6 skeleton variants deployed across ~60 pages |
| Pagination | DONE | Pagination component on 10 list pages |
| Empty states | DONE | EmptyState component standardized across all list pages |
| Toast notifications | DONE | Migrated 12 pages from inline banners to useToast |
| ResponsiveTable | DONE | 3 remaining raw tables converted |
| Error boundaries | DONE | ErrorBoundary component exists |
| Shared UI package | **GAP** | `packages/ui` is empty (.gitkeep only) |

### Infrastructure & CI/CD

| Area | Status | Gap |
|------|--------|-----|
| CI (web) | DONE | Lint, typecheck, build, test in GitHub Actions |
| CI (ai-gateway) | DONE | pytest with coverage in GitHub Actions |
| CI (core) | **GAP** | RSpec not running in CI due to Ruby < 4.0 blocker (Blocker #1) |
| Deploy | DONE | Railway deployment pipeline with smoke tests |
| Database migrations | **GAP** | 7 tables in schema.rb have no matching migration files (Blocker #5) |
| Production bootstrap | **GAP** | No production-safe seed script; encryption keys not provisioned |

---

## UX Spec Coverage Matrix (§3.2–3.8)

### §3.2 App Shell

| Element | Status | Notes |
|---------|--------|-------|
| Left nav (Plan, Teach, Assess, Report, Communicate, Admin) | DONE | AppShell component with role-aware nav |
| Top bar: school selector | PARTIAL | SchoolSelector component exists; multi-tenant switching UX is thin |
| Top bar: search | DONE | GlobalSearch component with `/api/v1/search` |
| Top bar: notifications | DONE | NotificationBell component with unread_count polling |
| Right context panel on planner screens | **GAP** | AiAssistantPanel exists but the UX spec envisions a broader "context panel" — currently AI-only |

### §3.3 Auth & Onboarding

| Element | Status | Notes |
|---------|--------|-------|
| Google sign-in | DONE | Login page with Google OAuth button |
| SSO/SAML sign-in | DONE | Login page with SSO toggle |
| School selection | PARTIAL | First-time setup wizard exists at /setup |
| First-time onboarding | PARTIAL | Setup page handles initial config; no guided walkthrough |

### §3.4 Teacher Screens (14 specified)

| Screen | Status | Page Path |
|--------|--------|-----------|
| Dashboard | DONE | /dashboard |
| Unit Library | DONE | /plan/units |
| Unit Planner | DONE | /plan/units/[id] |
| Lesson Editor | DONE | /plan/units/[id]/lessons/[lessonId] |
| Template Library | DONE | /plan/templates |
| Standards Browser | DONE | /plan/standards |
| Publish Preview | DONE | /plan/units/[id]/preview |
| Course Home | DONE | /teach/courses/[courseId] |
| Module Editor | DONE | /teach/courses/[courseId]/modules/[moduleId] |
| Assignment Editor | DONE | /teach/courses/[courseId]/assignments/[assignmentId] |
| Submissions Inbox | DONE | /teach/courses/[courseId]/submissions |
| Grading View | DONE | /teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId] |
| Discussions | DONE | /teach/courses/[courseId]/discussions/[discussionId] |
| Calendar | DONE | /plan/calendar |

### §3.5 Student Screens (4 specified + extras)

| Screen | Status | Page Path |
|--------|--------|-----------|
| Dashboard | DONE | /learn/dashboard |
| Course Modules | DONE | /learn/courses/[courseId] |
| Assignment Submission | DONE | /learn/courses/[courseId]/assignments/[assignmentId] |
| Quiz Attempt | DONE | /learn/courses/[courseId]/quizzes/[quizId]/attempt |
| Grades (extra) | DONE | /learn/grades |
| Quiz Results (extra) | DONE | /learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId] |
| Discussions (extra) | DONE | /learn/courses/[courseId]/discussions/[discussionId] |

### §3.6 Admin & Curriculum Screens (9 specified + extras)

| Screen | Status | Page Path |
|--------|--------|-----------|
| Admin Dashboard | DONE | /admin/dashboard |
| School Setup | DONE | /admin/school |
| Users & Roles | DONE | /admin/users |
| Integrations | DONE | /admin/integrations |
| AI Registry | DONE | /admin/ai |
| AI Policies | DONE | /admin/ai/policies |
| Standards Management | DONE | /admin/standards |
| Curriculum Map | DONE | /admin/curriculum-map |
| Approval Queue | DONE | /admin/approvals |
| SAML (extra) | DONE | /admin/integrations/saml |
| Sync (extra) | DONE | /admin/integrations/sync |
| LTI (extra) | DONE | /admin/lti |
| Retention (extra) | DONE | /admin/retention |
| AI Templates (extra) | DONE | /admin/ai/templates |

### §3.7 AI Assistant Panel

| Element | Status | Notes |
|---------|--------|-------|
| Draft, Differentiate, Assess, Rewrite | PARTIAL | AiAssistantPanel supports task selection and streaming; appears on Unit, Lesson, Template editors |
| Apply-to-plan | **GAP** | Generated content streams but "apply" action (auto-insert into editor fields) is not implemented |
| Policy banner | **GAP** | No visible "This AI action is governed by school policy" banner per UX spec |

### §3.8 Google & Classroom Add-Ons

| Element | Status | Notes |
|---------|--------|-------|
| Docs/Slides sidebar | **GAP** | AddonController API exists; no hosted sidebar app page |
| Classroom assignment flows | **GAP** | Backend jobs exist for sync/push/passback; no Classroom Add-on UI |

---

## Prioritized Gap Summary

### P0 — Blocks Production Readiness

| # | Gap | Spec Ref | Impact |
|---|-----|----------|--------|
| 1 | RBAC scope hardening (Wave 2) | PRD-9, TECH-2.3 | Students/teachers can enumerate data outside their enrolled context |
| 2 | CSRF enforcement verification | TECH-2.3 | State-changing API calls may be vulnerable to CSRF attacks |
| 3 | OAuth callback route in web | TECH-2.3 | Google sign-in may 404 after callback |
| 4 | Core RSpec in CI | PRD-23 | Backend regressions undetected in CI |
| 5 | Migration file gaps (7 tables) | TECH-2.4 | Schema drift across environments |

### P1 — Spec Parity

| # | Gap | Spec Ref | Impact |
|---|-----|----------|--------|
| 6 | AI policy enforcement end-to-end | PRD-14 | Admin policy settings don't actually restrict AI generation |
| 7 | AI invocation persistence verification | PRD-14 | Token usage and audit trail unreliable |
| 8 | OpenAPI contract expansion (70+ endpoints) | TECH-2.5 | API contracts incomplete |
| 9 | AI Assistant "apply-to-plan" action | UX-3.7 | Teachers must manually copy AI output |
| 10 | Google Add-on sidebar host pages | UX-3.8 | Add-on UX not deliverable without host pages |
| 11 | Shared UI package (packages/ui) | TECH-2.2 | Component duplication, no design system |

### P2 — Quality & Scale

| # | Gap | Spec Ref | Impact |
|---|-----|----------|--------|
| 12 | Backend test depth (line coverage) | PRD-23 | Shallow happy-path specs miss edge cases |
| 13 | Frontend integration tests (login, quiz, grading) | PRD-23 | Critical user flows untested |
| 14 | E2E data flow test (web → core → ai-gateway) | PRD-23 | No proof the full stack works together |
| 15 | Production bootstrap (seeds, encryption) | TECH-2.11 | Can't safely provision new production tenants |
| 16 | Observability and runbooks | TECH-2.11 | No documented incident response paths |

---

## Inventory Summary

| Layer | Count |
|-------|-------|
| Rails models | 60 (58 TenantScoped) |
| Rails controllers | 64 (63 with Pundit authorize) |
| Pundit policies | 56 |
| Serializers | 51 |
| Background jobs | 12 |
| Migrations | 61 |
| Database tables | 60+ |
| Backend specs | 210 files |
| Next.js pages | 104 |
| React components | 30 |
| Frontend tests | 47 files, 232 tests |
| AI Gateway endpoints | 4 |
| AI Gateway tests | 5 files, 49+ tests |
| OpenAPI schemas | 48 (core) + 7 (gateway) |
