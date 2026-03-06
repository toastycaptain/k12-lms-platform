# Task 38 — IB STEP9 PYP VERTICAL SLICE COORDINATOR REVIEW POI LINKAGE AND EXHIBITION HOOK

## Position in sequence
- **Step:** 9 — Build the first full-stack vertical slice — PYP
- **Run after:** Task 37
- **Run before:** Task 39 completes the slice on student/guardian surfaces and release readiness.
- **Primary mode:** Backend + Frontend

## Objective
Finish the PYP slice by wiring coordinator review, POI linkage visibility, and exhibition seeding/hook behaviour into the live unit/evidence/family flow.

## Why this task exists now
The PYP experience is not complete until coordinators can review real work in context, see its POI relevance, and identify whether it feeds exhibition or other programme-level planning.

## Current repo anchors
- Outputs from Tasks 22–23, 16–18, and 37
- `apps/web/src/features/ib/review/ReviewQueue.tsx`
- `apps/web/src/features/ib/pyp/ProgrammeOfInquiryBoard.tsx`
- `apps/web/src/features/ib/pyp/PypExhibitionWorkspace.tsx`
- `apps/web/src/features/ib/home/CoordinatorOverview.tsx`

## Scope
- Ensure the PYP unit can move into coordinator review with real workflow state and comments.
- Show POI linkage and coherence signals in the review context.
- Seed or link exhibition follow-up where relevant without fully building a separate exhibition vertical slice here.

## Backend work
- Add any missing review endpoints/payloads specific to PYP slice approval and POI context.
- Ensure review events update operations/queue summaries correctly.
- Implement or refine exhibition-hook relationships if the slice needs to create lightweight exhibition candidate records or flags.

## Frontend work
- Bind review queue rows and PYP coordinator pages to the real unit/evidence/story state from the slice.
- Render POI context and coherence hints during review, not only on the standalone POI board.
- Allow coordinator comments/returns/approvals to flow back into the teacher unit context cleanly.

## Data contracts, APIs, and model rules
- Document the review states and how POI/exhibition context is surfaced in review payloads.
- Keep exhibition behaviour lightweight here: the slice only needs a hook or seed, not the full exhibition management release.

## Risks and guardrails
- Do not make review another detached admin page with no route back to the live unit and evidence context.
- Do not overbuild exhibition management here; keep it to slice-relevant seeding/hook behaviour.

## Testing and verification
- Integration tests for review queue transition, POI context rendering, and returned-with-comments flows.
- Ensure operations center metrics update when units move through review/publish states.

## Feature flags / rollout controls
- Remain under `ib_pyp_vertical_slice_v1`; any exhibition-specific expansion beyond the hook should stay under its own flag if needed.
- Do not start broad MYP/DP review logic here.

## Acceptance criteria
- The PYP slice now closes the loop from teacher planning to coordinator review with programme context.

## Handoff to the next task
- Task 39 completes the slice on student/guardian surfaces and release readiness.
