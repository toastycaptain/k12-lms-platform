# Task 33 — IB STEP8 WORKFLOW ENGINE UNIFICATION TELEMETRY AND DEPRECATION

## Position in sequence
- **Step:** 8 — Consolidate the planning stack
- **Run after:** Task 32
- **Run before:** Task 34 begins the PYP full-stack vertical slice. Do not begin MYP or DP slices yet.
- **Primary mode:** Backend + Frontend

## Objective
Unify workflow handling around the chosen curriculum-document workflow engine for IB mode, add telemetry/deprecation instrumentation, and clean up duplicate workflow paths enough to make the system maintainable.

## Why this task exists now
The repository has signs of multiple workflow layers. After the planning-stack cutover, IB mode needs one clear workflow path with traceable telemetry and deprecation boundaries.

## Current repo anchors
- `apps/core/app/services/curriculum/workflow_engine.rb`
- Any duplicate workflow services under `apps/core/app/services`
- `apps/web/src/curriculum/workflow/*`
- `apps/web/src/features/ib/review/ReviewQueue.tsx`
- `apps/web/src/features/ib/families/PublishingQueue.tsx`

## Scope
- Choose and document the single workflow engine/path that IB mode uses after the cutover.
- Instrument workflow transitions, failures, and deprecated-path usage.
- Add deprecation warnings or internal telemetry around any legacy workflow actions still hit by IB users.

## Backend work
- Refactor controllers/services to use the chosen workflow path consistently for IB documents and related subsystems.
- Add telemetry/logging for transitions, failures, and deprecated legacy routes.
- Document deprecation timelines for any old approval/publish/archive endpoints that IB should stop using.

## Frontend work
- Update frontend workflow action hooks/components if endpoint shapes or transition semantics are clarified.
- Ensure review queue, studios, evidence queue, and publish queue all render the unified workflow states and actions consistently.

## Data contracts, APIs, and model rules
- Document canonical workflow state labels vs UI labels so later packs/slices do not drift.
- Keep telemetry structured enough to answer: which workflows are used, where transitions fail, and which screens still call deprecated paths.

## Risks and guardrails
- Do not silently change workflow semantics for existing records without migration/audit coverage.
- Do not over-clean deprecated paths needed by non-IB users.

## Testing and verification
- Workflow-engine tests proving unified path usage for IB-related records.
- Telemetry/logging smoke tests or at least assertions around emitted events.
- Frontend regression tests that review/publish actions still work after cleanup.

## Feature flags / rollout controls
- Keep deprecation warnings internal or admin-visible initially; do not confuse end users with technical language.
- Do not remove legacy workflow code needed by other curricula until their migration plans exist.

## Acceptance criteria
- IB mode has one clear workflow path, better observability, and a cleaner maintenance story.
- Steps 1–8 are now complete and the system is ready for the PYP vertical slice.

## Handoff to the next task
- Task 34 begins the PYP full-stack vertical slice. Do not begin MYP or DP slices yet.
