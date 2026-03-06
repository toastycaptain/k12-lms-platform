# Task 36 — IB STEP9 PYP VERTICAL SLICE UNIT STUDIO WEEKLY FLOW AND COLLABORATION

## Position in sequence
- **Step:** 9 — Build the first full-stack vertical slice — PYP
- **Run after:** Task 35
- **Run before:** Task 37 extends the slice into evidence, reflection, and family window/story publishing.
- **Primary mode:** Backend + Frontend

## Objective
Complete the live PYP unit studio journey for the slice: real content editing, weekly flow linkage, specialist contribution, field comments/review notes, readiness state, and version-aware collaboration.

## Why this task exists now
The studio is the core teacher working surface. The slice succeeds only if a PYP teacher can genuinely plan, iterate, collaborate, and understand readiness without leaving the PYP route tree.

## Current repo anchors
- Outputs from Tasks 13–15 and 35
- `apps/web/src/features/ib/pyp/PypUnitStudio.tsx`
- `apps/web/src/features/ib/pyp/PypWeeklyFlow.tsx`
- `apps/web/src/features/ib/pyp/PypActionPanel.tsx`
- `apps/web/src/features/ib/pyp/FamilyWindowCard.tsx`
- `apps/web/src/features/ib/specialist/*`
- `apps/core` collaboration/comment/document APIs

## Scope
- Ensure the PYP studio loads and saves real document versions for the unit and its weekly-flow-related content.
- Make weekly flow either a related document or a managed section with real persistence according to the architecture from Step 2; do not leave it as static UI.
- Allow specialist contributions and field comments inside the slice.
- Expose publish-readiness and blocked-by state clearly.

## Backend work
- Add or finalize any backend support needed for unit-to-weekly-flow relationship, readiness evaluation, and collaborator/comment counts.
- Ensure weekly flow edits participate in versioning and/or relationship updates consistently.

## Frontend work
- Bind all major studio panels to live data and comments.
- Support inline save/create-version, field comment anchors, and specialist contribution flows inside the studio.
- Keep the studio faster and calmer than competitor patterns: sticky context, no tab maze, clear next actions.

## Data contracts, APIs, and model rules
- Define whether weekly flow is its own document type (`ib_pyp_weekly_flow`) or a structured linked child of the main unit. Stick to the decision consistently.
- Define the readiness contract that decides when the family window can be composed or when coordinator review can start.

## Risks and guardrails
- Do not split one PYP planning action across too many separate pages if the studio can own it contextually.
- Do not keep readiness as a frontend-only heuristic; it must reflect backend validation/workflow state.

## Testing and verification
- Integration tests for live editing, version creation, comment usage, and weekly flow persistence.
- Specialist contribution tests inside the PYP studio.

## Feature flags / rollout controls
- Remain under `ib_pyp_vertical_slice_v1`.
- Do not add unrelated MYP/DP studio logic here.

## Acceptance criteria
- The PYP studio is now a live collaborative planning environment for the slice.

## Handoff to the next task
- Task 37 extends the slice into evidence, reflection, and family window/story publishing.
