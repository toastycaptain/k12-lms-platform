# Task 44 — IB STEP10 MYP VERTICAL SLICE SUBJECT UNIT STUDIO LIVE BINDING

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 43
- **Run before:** Task 45 deepens the studio around concepts, contexts, statement of inquiry, and inquiry-question logic
- **Primary mode:** Backend + Frontend

## Objective
Turn the MYP subject-unit studio into a fully live, versioned, collaborative operational surface backed by real documents, comments, workflow state, and readiness signals.

## Why this task exists now
The subject-unit studio is the main teacher surface for MYP. The slice cannot succeed if the studio still behaves like a static demo or a generic planner wearing MYP labels.

## Current repo anchors
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- document/version/comment APIs and hooks from prior packs
- `apps/web/src/features/ib/review/*`
- `apps/web/src/features/ib/specialist/*`
- teacher console links from Phase 3

## Scope
- load the real MYP unit document by canonical route
- support autosave, explicit versioning where needed, and stable save indicators
- surface collaborators, field comments, review notes, and readiness state in-context
- expose linked interdisciplinary/project/service panels without making the user leave the studio for common tasks

## Backend work
- Ensure the unit detail payload includes everything the studio needs in one or very few calls:
  - current version content
  - workflow state and allowed transitions
  - comment counts / field anchors
  - linked objects summary (interdisciplinary units, projects, service entries, evidence)
  - collaborator roles and last activity if available
  - readiness/blocker reason codes
- Add or optimize summary endpoints where the frontend would otherwise fan out into many requests.
- Ensure backend validation returns field-level errors mapped cleanly to schema fields.

## Frontend work
- Replace any remaining static sections with live hooks.
- Add sticky side context for linked objects, workflow state, and quick actions.
- Support inline field comments, comment threads, and “return with comments” awareness inside the studio.
- Make version compare and changed-since-last-publish/review visible where it helps teacher trust.
- Ensure the studio works as a primary surface, not a decorative wrapper around generic forms.

## UX / interaction rules
- keep the main teaching/planning content central; use side rails for status and linked objects
- do not force teachers through too many tabs for common changes
- preserve scroll location and draft state when opening linked comment or evidence drawers
- make readiness/blockers explicit, short, and explainable

## Data contracts, APIs, and model rules
- Define what belongs in the main unit document vs linked child records.
- Readiness must be backed by persisted validation/workflow state, not frontend heuristics.
- Keep linked-summary payloads shallow enough for speed but rich enough for at-a-glance operations.

## Risks and guardrails
- Do not recreate a crowded secondary-grade form graveyard.
- Do not hide crucial workflow state under menus or badge-only affordances.
- Do not make collaboration features dependent on full page reloads.

## Testing and verification
- Frontend integration tests for loading, saving, collaboration drawers, and blocked-state rendering.
- Request specs for unit detail and save/transition payloads.
- Regression tests ensuring no static mock arrays remain in the unit studio.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`

## Acceptance criteria
- The MYP subject-unit studio is a real operational planning surface backed by live data, versioning, comments, and workflow state.

## Handoff to the next task
- Task 45 deepens the studio around concepts, contexts, statement of inquiry, and inquiry-question logic.
