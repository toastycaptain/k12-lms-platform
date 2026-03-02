# CODEX_WEB_API_PARITY_FOR_IOS_STUDENT_APP

## Objective

Define backend + web parity work required so each requested iOS student feature has a complementary platform feature, while staying aligned with current architecture and rules.

This document is the dependency spec for `iOS/CODEX_IOS_STUDENT_APP_MASTER_PLAN.md`.

---

## Scope Boundaries

## In scope

- API additions/adjustments needed for iOS student dashboard and feature parity
- Complementary student-facing web routes/components
- Contract updates in `packages/contracts/core-v1.openapi.yaml`
- Tests for Rails and Next.js parity paths

## Out of scope

- Real-time collaborative editing
- Video conferencing
- Full SIS features
- Proctoring
- Marketplace

---

## Existing Coverage vs Gaps

| Requested Capability | Current State | Gap |
|---|---|---|
| Chat with teachers | `message_threads` + `messages` APIs and web communicate pages exist | No major API gap |
| Announcements | APIs and web communicate view exist | No major API gap |
| Personal calendar | `/api/v1/calendar` exists | Student web calendar route is not dedicated |
| Classes for day | Courses/sections available | No "today schedule" data model/endpoint |
| To-dos | Can derive from assignments/submissions | No first-class todo endpoint or model |
| Goals | Missing | Needs new model/controller/policy/UI |
| Portfolio | Spec exists but not implemented | For now only placeholder required |

---

## Workstream 1: Mobile-Compatible Auth

Current auth is cookie-session + CSRF. This works, but is fragile for native mobile.

## Required tasks

1. Add and document a mobile auth flow (recommended):
   - `POST /api/v1/mobile/sessions` (token exchange)
   - `POST /api/v1/mobile/refresh`
   - `DELETE /api/v1/mobile/session`
2. Keep tenant resolution explicit:
   - Require `X-Tenant-Slug` for mobile token flows.
3. Ensure Pundit and tenant scoping remain unchanged for all mobile-authenticated requests.
4. Update OpenAPI and add auth integration tests.

If mobile token auth is deferred, formally document cookie + CSRF behavior as the temporary contract for iOS.

---

## Workstream 2: Goals (New Backend + Web Capability)

## Backend additions

1. Migration: `goals` table
   - `tenant_id` (not null, indexed)
   - `student_id` (FK users)
   - `title`, `description`
   - `status` (`active`, `completed`, `archived`)
   - `target_date` (optional)
   - `progress_percent` (0..100)
2. Model: `Goal` including `TenantScoped`.
3. Policy: `GoalPolicy`
   - Student manages own goals.
   - Teacher/admin read according to role policy.
4. Controller: `Api::V1::GoalsController`
   - `index`, `show`, `create`, `update`, `destroy`
5. Routes under `/api/v1/goals`.
6. Serializer + request specs + policy specs.

## Web parity

1. Add `apps/web/src/app/learn/goals/page.tsx`.
2. Add Goals tile/link in student dashboard/navigation.
3. Add create/edit/complete UI states consistent with student permissions.

---

## Workstream 3: To-dos (Aggregator API + Web Parity)

Prefer a derived aggregator endpoint instead of a separate todo table in the first iteration.

## Backend additions

1. Add `GET /api/v1/students/:student_id/todos`.
2. Compose from:
   - published assignments not yet submitted
   - quiz attempts still pending (where applicable)
   - active goals (once goals exist)
3. Include normalized fields:
   - `id`, `source_type`, `source_id`, `title`, `due_at`, `status`, `course_id`, `priority`
4. Enforce policy via student/guardian/teacher access rules similar to progress endpoints.

## Web parity

1. Add `apps/web/src/app/learn/todos/page.tsx`.
2. Show consistent categories and status tags used by iOS.

---

## Workstream 4: Classes for Today (Schedule Capability)

Current data model lacks recurring class meeting times.

## Backend additions

1. Add `section_meetings` table:
   - `tenant_id` (not null, indexed)
   - `section_id` (FK)
   - `weekday` (0-6)
   - `start_time`, `end_time`
   - `location` (optional)
2. Add `GET /api/v1/students/:student_id/classes_today`.
3. Response shape:
   - section/course identifiers
   - class start/end timestamps in tenant timezone
   - teacher summary
4. Add policies/scopes with enrollment checks.

## Web parity

1. Add "Today’s Classes" block in `apps/web/src/app/learn/dashboard/page.tsx`.
2. Optionally add dedicated `apps/web/src/app/learn/classes/page.tsx`.

---

## Workstream 5: Student Calendar Route on Web

## Web additions

1. Create `apps/web/src/app/learn/calendar/page.tsx` using existing `/api/v1/calendar`.
2. Add Calendar tile/link under Learn for students.
3. Keep event semantics aligned with existing API fields:
   - `type`, `id`, `title`, `start_date`, `end_date`, `due_date`, `course_id`, `status`.

---

## Workstream 6: Portfolio Placeholder Parity

For this phase, do not implement full portfolio backend.

## Web additions

1. Add `apps/web/src/app/learn/portfolio/page.tsx` placeholder.
2. Add Portfolio tile/link in student dashboard/nav.
3. Empty-state copy should make status explicit: "Portfolio is coming soon."

## Backend additions

- None required for placeholder phase.

---

## Workstream 7: API Contract and Client Stability

1. Update `packages/contracts/core-v1.openapi.yaml` for all new endpoints.
2. Keep schema field names consistent with existing serializers.
3. Add or update contract tests in:
   - `apps/web/src/test/contract-tests/`
4. Ensure pagination behavior is documented where relevant.

---

## Workstream 8: Testing and Compliance

## Backend

- RSpec request specs for `goals`, `todos`, `classes_today`, and mobile auth endpoints.
- Policy specs proving tenant and role boundaries.
- Migration checks ensuring `tenant_id` presence and indexes.

## Web

- Route-level tests for new Learn pages (`goals`, `todos`, `calendar`, `portfolio` placeholder).
- Dashboard tests for new tiles and summaries.

---

## Suggested Implementation Order

1. Mobile auth contract decision + implementation
2. Goals API + web goals page
3. To-do aggregator endpoint + web todo page
4. Section meetings + classes today endpoint + web dashboard block
5. Student calendar route
6. Portfolio placeholder web route
7. OpenAPI/contract test updates
8. End-to-end regression checks

---

## Definition of Done

- iOS-required features have matching backend/web capabilities or explicit placeholders.
- New backend work follows tenant scoping + Pundit authorization on every action.
- OpenAPI contract reflects reality for all newly introduced endpoints.
- Student role can use goals/todos/calendar/classes consistently on web and iOS.
- Placeholder portfolio exists in both clients without backend write dependencies.
