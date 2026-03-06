# Task 32 — IB STEP8 FRONTEND IB CUTOVER FROM LEGACY PLAN SURFACES

## Position in sequence
- **Step:** 8 — Consolidate the planning stack
- **Run after:** Task 31
- **Run before:** Task 33 unifies workflow engine usage, telemetry, and deprecation cleanup around the cutover.
- **Primary mode:** Backend + Frontend

## Objective
Cut the IB frontend over from legacy plan surfaces and generic plan routes to the live IB document-backed surfaces, while preserving safe redirects and non-IB compatibility.

## Why this task exists now
The backend migration and architecture plan are now in place. This task makes the IB user experience consistent by ensuring IB users land in IB-native document-backed screens instead of a mixture of old and new planning surfaces.

## Current repo anchors
- Output from Tasks 30–31
- `apps/web/src/app/plan/*`
- `apps/web/src/app/ib/*`
- `apps/web/src/features/ib/core/route-registry.ts`
- `apps/web/src/features/curriculum/navigation/registry.ts`
- `apps/web/src/components/AppShell.tsx` or current shell equivalents

## Scope
- Redirect or hide legacy plan routes for IB users where appropriate.
- Ensure any remaining “create unit” or “open unit” actions in IB mode land on curriculum-document-backed IB pages.
- Preserve non-IB behaviour for American/British modes and shared generic planner paths where still needed.

## Backend work
- Add any backend redirects or compatibility endpoints if route cutover reveals gaps.

## Frontend work
- Update navigation, create flows, route helpers, and “open in plan” actions so IB mode defaults to the IB route tree and live document objects.
- Add user-friendly notices/redirects for old IB bookmarks pointing to legacy plan pages.
- Remove or isolate any remaining IB-only codepaths that still depend on `UnitPlan`/`LessonPlan` UI surfaces.

## Data contracts, APIs, and model rules
- Document the exact IB/non-IB branching rules so future curriculum work does not accidentally undo the cutover.
- Use the pack/runtime to decide whether a user should be routed to IB-native vs generic plan surfaces.

## Risks and guardrails
- Do not send all users into IB routes by accident; runtime pack/role detection must remain correct.
- Do not break deep links created during prior phases without redirect coverage.

## Testing and verification
- Frontend integration tests for route cutover and redirect behaviour.
- Regression tests ensuring non-IB routes remain intact.
- Manual verification that old IB bookmarks land in appropriate new destinations.

## Feature flags / rollout controls
- Gate final cutover behind `ib_documents_only_v1` until migration confidence is high.
- Do not delete legacy generic plan pages yet if other curricula still rely on them.

## Acceptance criteria
- IB users now experience one coherent planning system.
- Legacy/generic plan surfaces are no longer the accidental source of truth for IB mode.

## Handoff to the next task
- Task 33 unifies workflow engine usage, telemetry, and deprecation cleanup around the cutover.
