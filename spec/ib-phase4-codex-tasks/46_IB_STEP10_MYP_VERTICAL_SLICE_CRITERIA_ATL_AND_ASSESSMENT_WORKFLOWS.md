# Task 46 — IB STEP10 MYP VERTICAL SLICE CRITERIA, ATL, AND ASSESSMENT WORKFLOWS

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 45
- **Run before:** Task 47 links subject-unit planning to interdisciplinary co-planning and shared assessment contexts
- **Primary mode:** Backend + Frontend

## Objective
Make MYP criteria planning, ATL emphasis, and assessment design/workflow fully live and operational inside the slice, with real persistence, readiness logic, evidence hooks, and coordinator visibility.

## Why this task exists now
This is one of the biggest product differentiation moments for MYP. Teachers need criteria and ATL planning to feel native and practical, not like extra compliance fields. Coordinators need coverage and reviewable quality signals.

## Current repo anchors
- Outputs from Tasks 08, 10, 44, and 45
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- `apps/web/src/features/ib/assessment/*`
- evidence subsystem from Phase 3
- framework/standards alignment primitives

## Scope
- criteria selection/planning
- ATL focus selection and optional unpacking
- formative and summative assessment plan structures
- task-specific clarifications/attachments where applicable
- linked evidence prompts or checkpoints from assessment points
- coordinator visibility into criteria/ATL coverage and completeness

## Backend work
- Ensure the schema and/or related relational objects can express:
  - selected criteria strands/rows as needed by school implementation
  - ATL category and skill focus
  - assessment task metadata with due dates, evidence checkpoints, or rubrics/task-specific clarifications
- Add relational or indexed structures where later coordinator coverage queries would be too costly or impossible if left only inside unindexed JSON.
- Expose detail and summary payloads that include criteria/ATL/assessment completeness and next-action states.

## Frontend work
- Build/finish the criteria and ATL authoring surfaces inside the MYP unit studio.
- Keep assessment planning contextual, not a disconnected form stack.
- Show how criteria/ATL connect to evidence and later student-facing views.
- Make incomplete assessment design visible without punishing drafting flow too early.

## UX / interaction rules
- criteria and ATL should be quick to select and easy to review at a glance
- assessment sections should support progressive disclosure: basic now, depth when needed
- avoid modal overload for task-specific clarifications or rubric attachments
- keep “what still needs attention” obvious and stable

## Data contracts, APIs, and model rules
- If coverage or analytics depend on criteria/ATL, store enough normalized/indexed data to query them reliably.
- Do not make assessment readiness a purely frontend computation.
- Define how evidence hooks are generated from assessment tasks without auto-creating noisy artifacts.

## Risks and guardrails
- Do not make the unit studio collapse into a dense spreadsheet of criteria rows.
- Do not create ATL data that teachers must duplicate manually across unit, evidence, and student views.
- Do not over-automate evidence creation if that generates clutter.

## Testing and verification
- Validation tests for criteria/ATL/assessment structures.
- Frontend tests for selection, editing, blocked-state, and linked evidence prompts.
- Query tests for coordinator coverage summaries.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`

## Acceptance criteria
- Teachers can plan criteria, ATL, and assessments in a live MYP-native flow, and coordinators can see coverage and risk from real persisted data.

## Handoff to the next task
- Task 47 links subject-unit planning to interdisciplinary co-planning and shared assessment contexts.
