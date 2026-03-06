# Task 34 — IB STEP9 PYP VERTICAL SLICE MASTER PLAN

## Position in sequence
- **Step:** 9 — Build the first full-stack vertical slice — PYP
- **Run after:** Task 33
- **Run before:** Task 35 begins the PYP slice by binding planning context and unit creation to the live route/document/POI system.
- **Primary mode:** Backend + Frontend

## Objective
Define the exact scope, release boundaries, feature flags, acceptance criteria, and entity interactions for the first full-stack PYP vertical slice: PYP Unit Studio → Weekly Flow → Evidence Inbox → Family Window → Coordinator Review → Guardian/Student surfaces.

## Why this task exists now
Steps 1–8 created the operational substrate. This task ensures the PYP slice is delivered as one coherent experience rather than as several disconnected sub-features.

## Current repo anchors
- Outputs from Tasks 01–33
- `apps/web/src/features/ib/pyp/*`
- `apps/web/src/features/ib/evidence/*`
- `apps/web/src/features/ib/families/*`
- `apps/web/src/features/ib/home/*`
- `apps/web/src/features/ib/guardian/*`
- `apps/core/app/models/*` relevant to documents, evidence, POI, stories

## Scope
- Define the exact PYP slice boundaries and what is in/out for this release.
- Write a slice architecture note mapping entities, routes, permissions, and state transitions end-to-end.
- Confirm feature flags, rollout order, and demo/QA expectations.
- Explicitly state that MYP and DP vertical slices are **next packs**, not part of this one.

## Backend work
- Validate that all required backend domain pieces from prior tasks are present and identify any still-missing implementation prerequisites.
- Add slice-level API summary endpoints if the end-to-end flow benefits from them.

## Frontend work
- Validate that all required frontend routes and components exist and identify the final cutover points for the PYP slice.
- Add slice-level navigation entry points and launch surfaces where needed.

## Data contracts, APIs, and model rules
- Document the golden-path journey: create/open PYP unit → edit central idea/lines/week flow → capture evidence → request student reflection → compose family window/story → coordinator reviews → publish → guardian sees calm feed/current unit window.
- Document failure states and degraded states.
- Define the slice-level definition of done in measurable terms.

## Risks and guardrails
- Do not allow the PYP slice to balloon into “all PYP features.” Keep it focused on one coherent end-to-end workflow.
- Do not pull in MYP/DP vertical work during this slice.

## Testing and verification
- Architecture note reviewed in-repo.
- Smoke tests or a checklist proving every required dependency from Tasks 01–33 exists before deeper slice work begins.

## Feature flags / rollout controls
- Use `ib_pyp_vertical_slice_v1` as the umbrella flag for the slice.
- Do not include MYP or DP vertical behaviours here beyond route coexistence and no-regression checks.

## Acceptance criteria
- There is a clear, shared implementation map for the PYP slice.
- The next tasks can execute end-to-end without re-litigating scope.

## Handoff to the next task
- Task 35 begins the PYP slice by binding planning context and unit creation to the live route/document/POI system.
