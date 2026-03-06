# Task 37 — IB STEP9 PYP VERTICAL SLICE EVIDENCE REFLECTION AND FAMILY WINDOW

## Position in sequence
- **Step:** 9 — Build the first full-stack vertical slice — PYP
- **Run after:** Task 36
- **Run before:** Task 38 adds coordinator review, POI linkage, and exhibition seeding so the slice closes the programme loop.
- **Primary mode:** Backend + Frontend

## Objective
Connect the live PYP unit flow to evidence capture, reflection requests, family-window/story composition, and publishing queue state so the slice covers the authentic PYP evidence-to-family journey.

## Why this task exists now
A PYP slice that ends at planning is incomplete. The product’s value comes from taking live learning moments through reflection and into a deliberate family-facing window or story.

## Current repo anchors
- Outputs from Tasks 19–21 and 36
- `apps/web/src/features/ib/evidence/*`
- `apps/web/src/features/ib/families/*`
- `apps/web/src/features/ib/family/LearningStoryComposer.tsx`
- `apps/web/src/features/ib/pyp/FamilyWindowCard.tsx`
- `apps/web/src/features/ib/pyp/PypActionPanel.tsx`

## Scope
- Make evidence capture/triage live for the PYP slice and clearly linked to the active unit.
- Support reflection requests tied to evidence moments and PYP action where appropriate.
- Support family-window/story composition and publishing queue flow as part of the slice.
- Keep visibility and publishing decisions explicit and calm.

## Backend work
- Ensure backend evidence/story APIs support filtering by active PYP unit and planning context.
- Add any missing helper endpoints for “compose family window from this unit/evidence selection” if the UX benefits from it.

## Frontend work
- Bind evidence inbox and story composer flows directly from the active PYP unit context.
- Allow a teacher to move from a unit evidence checkpoint to reflection request to family-window/story draft without losing context.
- Surface publishing readiness/blockers inside the family window card or adjacent rail.

## Data contracts, APIs, and model rules
- Document the exact slice handoff from unit readiness to evidence to family publishing.
- Ensure internal-only notes and family-visible narrative remain clearly separated throughout the flow.

## Risks and guardrails
- Do not require teachers to leave the unit context repeatedly just to manage evidence and family windows.
- Do not auto-publish or auto-schedule family items in this slice; explicit review/queue state is required.

## Testing and verification
- Integration tests covering evidence selection, reflection request creation, story draft composition, and queue movement.
- Guardian-preview tests ensuring only family-visible content appears in previews.

## Feature flags / rollout controls
- Keep under `ib_pyp_vertical_slice_v1`.
- Do not broaden into a schoolwide evidence rewrite beyond what the PYP slice needs.

## Acceptance criteria
- The PYP slice now spans planning → evidence → reflection → family window/story draft.

## Handoff to the next task
- Task 38 adds coordinator review, POI linkage, and exhibition seeding so the slice closes the programme loop.
