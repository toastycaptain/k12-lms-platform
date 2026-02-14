# Traceability Matrix

Maps specification requirements to concrete implementation status.

Status legend:
- `Done` = implemented and wired in current product surface.
- `Partial` = significant implementation exists but important scope remains.
- `Deferred` = explicitly out of the current release scope.

| Spec ID | Description | Status | Implementation |
|---------|-------------|--------|----------------|
| PRD-9 | Phase 1 Foundation: multi-tenancy | Done | `apps/core/app/models/concerns/tenant_scoped.rb`, `apps/core/app/controllers/application_controller.rb` |
| PRD-9 | Phase 1 Foundation: RBAC | Partial | `apps/core/app/policies/*.rb` (wave 1 hardened in `course_policy.rb`, `enrollment_policy.rb`, `unit_plan_policy.rb`), `apps/core/app/models/user.rb`, `apps/core/app/models/role.rb` |
| PRD-9 | Phase 1 Foundation: unit/lesson versioning | Done | `apps/core/app/models/unit_plan.rb`, `apps/core/app/models/lesson_plan.rb`, `apps/core/config/routes.rb` |
| PRD-9 | Phase 1 Foundation: Drive attachments | Done | `apps/core/app/controllers/api/v1/drive_controller.rb`, `apps/core/app/services/google_drive_service.rb`, `apps/web/src/components/GoogleDrivePicker.tsx` |
| PRD-9 | Phase 1 Foundation: PDF export | Done | `apps/core/app/jobs/pdf_export_job.rb`, `apps/core/app/controllers/api/v1/unit_plans_controller.rb` |
| PRD-10 | Phase 2 Planning Excellence: templates | Done | `apps/core/app/models/template.rb`, `apps/core/app/controllers/api/v1/templates_controller.rb`, `apps/web/src/app/plan/templates` |
| PRD-10 | Phase 2 Planning Excellence: standards alignment | Done | `apps/core/app/controllers/api/v1/template_version_standards_controller.rb`, `apps/core/app/controllers/api/v1/unit_version_standards_controller.rb`, `apps/web/src/app/plan/standards` |
| PRD-10 | Phase 2 Planning Excellence: coverage reporting | Done | `apps/core/app/controllers/api/v1/standards_coverage_controller.rb`, `apps/web/src/app/admin/curriculum-map/page.tsx` |
| PRD-10 | Phase 2 Planning Excellence: approvals | Done | `apps/core/app/models/approval.rb`, `apps/core/app/controllers/api/v1/approvals_controller.rb`, `apps/web/src/app/admin/approvals/page.tsx` |
| PRD-11 | Phase 3 LMS Core: courses/modules | Done | `apps/core/app/controllers/api/v1/courses_controller.rb`, `apps/core/app/controllers/api/v1/course_modules_controller.rb`, `apps/web/src/app/teach/courses` |
| PRD-11 | Phase 3 LMS Core: assignments/submissions | Done | `apps/core/app/controllers/api/v1/assignments_controller.rb`, `apps/core/app/controllers/api/v1/submissions_controller.rb`, `apps/web/src/app/teach/submissions` |
| PRD-11 | Phase 3 LMS Core: rubrics/discussions | Done | `apps/core/app/controllers/api/v1/rubrics_controller.rb`, `apps/core/app/controllers/api/v1/discussions_controller.rb` |
| PRD-12 | Phase 4 Assessment: question banks | Done | `apps/core/app/controllers/api/v1/question_banks_controller.rb`, `apps/web/src/app/assess/banks` |
| PRD-12 | Phase 4 Assessment: quizzes/attempts | Done | `apps/core/app/controllers/api/v1/quizzes_controller.rb`, `apps/core/app/controllers/api/v1/quiz_attempts_controller.rb`, `apps/web/src/app/assess` |
| PRD-12 | Phase 4 Assessment: accommodations | Done | `apps/core/app/controllers/api/v1/quiz_accommodations_controller.rb`, `apps/web/src/app/assess/quizzes/[quizId]/page.tsx` |
| PRD-12 | Phase 4 Assessment: QTI import/export | Done | `apps/core/app/jobs/qti_import_job.rb`, `apps/core/app/jobs/qti_export_job.rb` |
| PRD-13 | Phase 5 Google Integrations: Classroom sync | Done | `apps/core/app/jobs/classroom_course_sync_job.rb`, `apps/core/app/jobs/classroom_roster_sync_job.rb`, `apps/core/app/jobs/classroom_grade_passback_job.rb` |
| PRD-13 | Phase 5 Google Integrations: Workspace/Classroom add-ons | Partial | `apps/core/app/controllers/api/v1/addon_controller.rb`, `apps/core/config/routes.rb` |
| PRD-14 | Phase 6 AI Gateway: provider registry + generation APIs | Done | `apps/ai-gateway/app/providers/registry.py`, `apps/ai-gateway/app/routers/v1.py` |
| PRD-14 | Phase 6 AI Gateway: task policies + admin registry UX + auditing | Partial | `apps/ai-gateway/app/safety/filters.py`, `apps/ai-gateway/app/prompts/system_prompts.py` |
| PRD-15 | Phase 7 Institutional Hardening: OneRoster + LTI + governance/DR | Deferred | `spec/PRD_K12_Planning_LMS_AI_Optimized.md`, `docs/BLOCKERS.md` |
| PRD-22 | Functional requirements | Partial | Broadly covered across `apps/core` and `apps/web`; AI and institutional hardening remain partial/deferred |
| PRD-23 | Non-functional quality gates | Partial | `.github/workflows/ci.yml`, `Makefile`, service-level tests in `apps/core/spec` and `apps/ai-gateway/tests` |
| TECH-2.1 | Service architecture (web/core/ai-gateway) | Done | `README.md`, `apps/web/README.md`, `apps/core/README.md`, `apps/ai-gateway/README.md` |
| TECH-2.2 | Monorepo structure | Partial | `apps/*` implemented, `packages/contracts` now bootstrapped (`core-v1.openapi.yaml`, `ai-gateway-v1.openapi.yaml`), `packages/ui` remains to be populated |
| TECH-2.5 | API style (`/api/v1` REST) | Done | `apps/core/config/routes.rb`, `apps/web/src/lib/api.ts` |
| TECH-2.7 | Background jobs | Done | `apps/core/app/jobs/*.rb` |
| TECH-2.10 | AI gateway contract | Done | `apps/ai-gateway/app/routers/v1.py`, `packages/contracts/ai-gateway-v1.openapi.yaml` |
| TECH-2.11 | Security and observability | Partial | `apps/core/app/policies/*.rb`, `apps/core/app/services/audit_logger.rb`, `apps/core/app/models/audit_log.rb`, `apps/core/config/initializers/rack_attack.rb`, `apps/ai-gateway/app/auth.py` |
| UX-3.2 | Planner-first app shell | Partial | `apps/web/src/components/AppShell.tsx` |
| UX-3.4 | Teacher screens | Partial | Implemented many Plan/Teach/Assess screens; some UX-spec screens still missing |
| UX-3.5 | Student screens | Partial | Student assignment submission and quiz attempt implemented; full student dashboard/module UX remains partial |
| UX-3.6 | Admin/curriculum screens | Partial | Approvals, integrations, curriculum map implemented; AI registry/policies and full school setup/users-roles UX remain partial |
| UX-3.7 | AI assistant panel | Partial | AI gateway exists; planner-integrated assistant panel is not complete |
| UX-3.8 | Google/Classroom add-on UX | Partial | API support present; full add-on product surface remains partial |
