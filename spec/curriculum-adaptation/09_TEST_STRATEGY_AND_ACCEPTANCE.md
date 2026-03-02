# Test Strategy and Acceptance

## Test Scope
- Backend: resolver logic, policies, request contracts, migrations/backfill.
- Frontend: admin controls, non-admin visibility rules, planner derivation.
- E2E: end-to-end profile selection to derived planner/integration behavior.

## Mandatory Authorization Tests
- teacher/curriculum_lead/student/guardian receive 403 on all curriculum config/import endpoints
- admin can perform all curriculum config/import operations
- non-admin UI snapshots confirm no curriculum authoring controls rendered
- non-admin users still receive correct derived profile-driven data

## Backend Test Matrix
1. Resolver precedence tests (`course > school > tenant > system`).
2. School/course payload schema and serialization tests.
3. Admin settings endpoint policy tests.
4. Import/upload endpoint policy tests.
5. Migration/backfill tests for null-safe and inferred mapping behavior.

## Frontend Test Matrix
1. Admin pages render curriculum controls for admin only.
2. Non-admin roles do not render curriculum authoring controls.
3. Unit creation defaults reflect effective profile context.
4. Standards/template filters derive from profile defaults.

## E2E Scenarios
1. Admin sets tenant default and school override, teacher sees derived planner changes.
2. Non-admin direct API mutation attempt returns `403`.
3. Google/LTI/OneRoster flows include derived context and still complete.
4. Fallback behavior works when school/course override is absent.

## Mandatory Acceptance Criteria
1. Any curriculum mutation attempt by non-admin returns `403`.
2. Non-admin UI contains zero curriculum authoring/import controls.
3. Non-admin users see only derived effective-profile behavior in planner/course data.
4. Admin-only upload/import paths are fully audited and policy-guarded.
