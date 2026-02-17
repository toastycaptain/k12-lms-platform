# Traceability Matrix

Maps specification requirements to concrete implementation status.

**Last updated:** 2026-02-16 (post Batch 3 execution)

Status legend:
- `Done` = implemented and wired in current product surface.
- `Partial` = significant implementation exists but important scope remains.
- `Deferred` = explicitly out of the current release scope.

| Spec ID | Description | Status | Implementation |
|---------|-------------|--------|----------------|
| PRD-9 | Phase 1 Foundation: multi-tenancy | Done | `apps/core/app/models/concerns/tenant_scoped.rb`, `apps/core/app/controllers/application_controller.rb` |
| PRD-9 | Phase 1 Foundation: RBAC | Done | `apps/core/app/policies/*.rb` (Wave 1 + Wave 2 hardened); all policies scoped by role and ownership |
| PRD-9 | Phase 1 Foundation: unit/lesson versioning | Done | `apps/core/app/models/unit_plan.rb`, `apps/core/app/models/lesson_plan.rb`, `apps/core/config/routes.rb` |
| PRD-9 | Phase 1 Foundation: Drive attachments | Done | `apps/core/app/controllers/api/v1/drive_controller.rb`, `apps/core/app/services/google_drive_service.rb`, `apps/web/src/components/GoogleDrivePicker.tsx` |
| PRD-9 | Phase 1 Foundation: PDF export | Done | `apps/core/app/jobs/pdf_export_job.rb`, `apps/core/app/controllers/api/v1/unit_plans_controller.rb` |
| PRD-10 | Phase 2 Planning Excellence: templates | Done | `apps/core/app/models/template.rb`, `apps/core/app/controllers/api/v1/templates_controller.rb`, `apps/web/src/app/plan/templates` |
| PRD-10 | Phase 2 Planning Excellence: standards alignment | Done | `apps/core/app/controllers/api/v1/template_version_standards_controller.rb`, `apps/core/app/controllers/api/v1/unit_version_standards_controller.rb`, `apps/web/src/app/plan/standards` |
| PRD-10 | Phase 2 Planning Excellence: coverage reporting | Done | `apps/core/app/controllers/api/v1/standards_coverage_controller.rb`, `apps/web/src/app/admin/curriculum-map/page.tsx`, `apps/web/src/app/report/standards-coverage/page.tsx` |
| PRD-10 | Phase 2 Planning Excellence: approvals | Done | `apps/core/app/models/approval.rb`, `apps/core/app/controllers/api/v1/approvals_controller.rb`, `apps/web/src/app/admin/approvals/page.tsx` |
| PRD-11 | Phase 3 LMS Core: courses/modules | Done | `apps/core/app/controllers/api/v1/courses_controller.rb`, `apps/core/app/controllers/api/v1/course_modules_controller.rb`, `apps/web/src/app/teach/courses` |
| PRD-11 | Phase 3 LMS Core: assignments/submissions | Done | `apps/core/app/controllers/api/v1/assignments_controller.rb`, `apps/core/app/controllers/api/v1/submissions_controller.rb`, `apps/web/src/app/teach/submissions` |
| PRD-11 | Phase 3 LMS Core: rubrics/discussions | Done | `apps/core/app/controllers/api/v1/rubrics_controller.rb`, `apps/core/app/controllers/api/v1/discussions_controller.rb` |
| PRD-12 | Phase 4 Assessment: question banks | Done | `apps/core/app/controllers/api/v1/question_banks_controller.rb`, `apps/web/src/app/assess/banks` |
| PRD-12 | Phase 4 Assessment: quizzes/attempts | Done | `apps/core/app/controllers/api/v1/quizzes_controller.rb`, `apps/core/app/controllers/api/v1/quiz_attempts_controller.rb`, `apps/web/src/app/assess` |
| PRD-12 | Phase 4 Assessment: accommodations | Done | `apps/core/app/controllers/api/v1/quiz_accommodations_controller.rb`, `apps/web/src/app/assess/quizzes/[quizId]/page.tsx` |
| PRD-12 | Phase 4 Assessment: QTI import/export | Done | `apps/core/app/jobs/qti_import_job.rb`, `apps/core/app/jobs/qti_export_job.rb` |
| PRD-13 | Phase 5 Google Integrations: Classroom sync | Done | `apps/core/app/jobs/classroom_course_sync_job.rb`, `apps/core/app/jobs/classroom_roster_sync_job.rb`, `apps/core/app/jobs/classroom_grade_passback_job.rb` |
| PRD-13 | Phase 5 Google Integrations: Workspace/Classroom add-ons | Done | `apps/core/app/controllers/api/v1/addon_controller.rb`, `apps/web/src/app/addon/workspace/page.tsx`, `apps/web/src/app/addon/classroom/page.tsx` |
| PRD-14 | Phase 6 AI Gateway: provider registry + generation APIs | Done | `apps/ai-gateway/app/providers/registry.py`, `apps/ai-gateway/app/routers/v1.py` |
| PRD-14 | Phase 6 AI Gateway: task policies + admin registry UX + auditing | Done | `apps/core/app/controllers/api/v1/ai_task_policies_controller.rb`, `apps/core/app/controllers/api/v1/ai_provider_configs_controller.rb`, `apps/web/src/app/admin/ai`, `apps/web/src/components/AiAssistantPanel.tsx` |
| PRD-15 | Phase 7 Institutional Hardening: OneRoster | Done | `apps/core/app/services/one_roster_client.rb`, `apps/core/app/jobs/one_roster_org_sync_job.rb`, `apps/core/app/jobs/one_roster_user_sync_job.rb` |
| PRD-15 | Phase 7 Institutional Hardening: LTI | Done | `apps/core/app/controllers/lti/launches_controller.rb`, `apps/core/app/controllers/lti/deep_links_controller.rb`, `apps/web/src/app/lti` |
| PRD-15 | Phase 7 Institutional Hardening: governance/DR | Partial | `apps/core/app/models/data_retention_policy.rb`, `apps/core/app/jobs/data_retention_enforcement_job.rb`, `docs/DATABASE_BACKUP.md`. Active Record Encryption not provisioned; backup automation not scheduled. |
| PRD-4 | Secondary Users: Parent/Guardian | Deferred | Not implemented. See `spec/CODEX_GUARDIAN_PORTAL.md` for planned implementation. |
| PRD-22 | Functional requirements | Done | All functional requirements implemented across `apps/core`, `apps/web`, and `apps/ai-gateway` |
| PRD-23 | Non-functional quality gates | Partial | CI active for all 3 services. Backend 91% line coverage, frontend 63%, AI gateway 94%. Production observability and encryption gaps remain. |
| TECH-2.1 | Service architecture (web/core/ai-gateway) | Done | `README.md`, three apps operational |
| TECH-2.2 | Monorepo structure | Partial | `apps/*` implemented, `packages/contracts` bootstrapped, `packages/ui` empty (see `spec/CODEX_SHARED_UI_EXTRACTION.md`) |
| TECH-2.5 | API style (`/api/v1` REST) | Done | `apps/core/config/routes.rb`, `apps/web/src/lib/api.ts` |
| TECH-2.7 | Background jobs | Done | `apps/core/app/jobs/*.rb` (12 jobs) |
| TECH-2.8 | Search strategy (Postgres FTS) | Partial | `GlobalSearch` component and search endpoint exist; FTS not implemented (see `spec/CODEX_SEARCH_DEPTH.md`) |
| TECH-2.10 | AI gateway contract | Done | `apps/ai-gateway/app/routers/v1.py`, `packages/contracts/ai-gateway-v1.openapi.yaml` |
| TECH-2.11 | Security and observability | Partial | Policies hardened, audit logging active, rate limiting configured. Encryption not provisioned, structured logging and runbooks needed (see `spec/CODEX_OBSERVABILITY_RUNBOOKS.md`, `spec/CODEX_PRODUCTION_ENVIRONMENT.md`). |
| UX-3.2 | Planner-first app shell | Done | `apps/web/src/components/AppShell.tsx` with role-aware nav, search, notifications, school selector |
| UX-3.3 | Auth & onboarding | Done | Login (Google + SAML), `/auth/callback`, `/setup` wizard |
| UX-3.4 | Teacher screens (14 specified) | Done | All 14 screens implemented: Dashboard, Unit Library/Planner, Lesson Editor, Templates, Standards, Publish Preview, Course Home, Module Editor, Assignment Editor, Submissions, Grading, Discussions, Calendar |
| UX-3.5 | Student screens (4 specified) | Done | Dashboard, Course Modules, Assignment Submission, Quiz Attempt (+ Grades, Quiz Results, Discussions) |
| UX-3.6 | Admin/curriculum screens (9 specified) | Done | All 9 + extras: Dashboard, School, Users, Integrations, AI Registry/Policies/Templates, Standards, Curriculum Map, Approvals, LTI, Retention, SAML, Sync |
| UX-3.7 | AI assistant panel | Done | `AiAssistantPanel.tsx` with streaming, polling fallback, task selection, abort, policy banner, apply-to-plan |
| UX-3.8 | Google/Classroom add-on UX | Done | `apps/web/src/app/addon/workspace/page.tsx`, `apps/web/src/app/addon/classroom/page.tsx` |
