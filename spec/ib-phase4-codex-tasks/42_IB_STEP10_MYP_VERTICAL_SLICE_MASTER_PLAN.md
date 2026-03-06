# Task 42 — IB STEP10 MYP VERTICAL SLICE MASTER PLAN

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Phase 3 Task 39 and the completion of the PYP vertical slice
- **Run before:** Task 43 begins the live route, entry, and creation path for the MYP slice
- **Primary mode:** Backend + Frontend

## Objective
Define the exact scope, release boundaries, entity map, route map, permissions, workflow boundaries, success metrics, and non-goals for the first complete MYP full-stack vertical slice.

## Why this task exists now
The MYP slice spans more operational surfaces than PYP: subject units, criteria/ATL assessment logic, interdisciplinary planning, project tracking, and service-as-action. Without a written slice boundary, the work will either balloon into “all of MYP” or fracture into disconnected sub-systems.

## Dependencies from prior packs
- Phase 3 Tasks 08, 10, 24, and 25 established the pack/schema and the initial live domain for MYP objects.
- Phase 3 teacher console, evidence, operations center, and document cutover work must already exist.

## Current repo anchors
- `apps/web/src/app/ib/myp/*`
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- `apps/web/src/features/ib/myp/InterdisciplinaryUnitStudio.tsx`
- `apps/web/src/features/ib/myp/ProjectsHub.tsx`
- `apps/web/src/features/ib/home/*`
- `apps/core/app/models/*` for curriculum documents, planning contexts, MYP project/service/interdisciplinary records
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor

## Scope
### In scope
- subject-unit launch → subject-unit studio → concept/context/inquiry → criteria/ATL/assessment
- interdisciplinary unit linkage and co-planning
- project hub operation (personal/community project variants as configured by school)
- service-as-action capture, reflection, approval, and visibility state
- coordinator coverage/risk/review
- student/guardian output for the slice
- release gates and telemetry

### Explicitly out of scope
- rebuilding all general secondary timetabling or full report-card systems
- exhaustive student transcript/report export work
- non-MYP curriculum coexistence work unless needed for regression protection
- any DP-specific implementation

## Slice architecture note to produce in this task
Write and commit an architecture note in-repo that covers:
- canonical route tree
- document types and relational models used in the slice
- subject-unit ↔ interdisciplinary ↔ project ↔ service relationships
- lifecycle/workflow states for each major object
- teacher, specialist, coordinator, student, and guardian role touchpoints
- risk/review surfaces and where their data comes from
- feature flags and rollout order

## Backend work
- Validate that all required domain models from Phase 3 exist; identify any missing relational pieces still needed for live slice execution.
- Add any slice-level summary endpoints or backend convenience payloads if they materially simplify the MYP end-to-end journey.
- Freeze or explicitly document the canonical source of truth for each slice object (document vs dedicated relational model vs linked child object).

## Frontend work
- Validate that all MYP routes referenced by the shell, teacher console, coordinator console, and student surfaces resolve to real pages.
- Decide which existing feature modules become the canonical slice entry surfaces.
- Add slice-level nav entry points from teacher home, coordinator operations, and student dashboards where missing.

## Data contracts, APIs, and model rules
- Define the golden path: create/open MYP unit → complete concept/context/inquiry scaffolding → plan criteria/ATL/assessment → link interdisciplinary work → manage project/service state → coordinator review/coverage visibility → student/guardian output.
- Define degraded states and what each role sees when linked objects are missing or incomplete.
- Clarify how MYP project variants differ by school configuration without forking the entire UI.

## Risks and guardrails
- Do not allow the slice to become “all secondary planning.” It is specifically an MYP slice.
- Do not treat project and service records as afterthought appendices; they are part of the real operational value.
- Do not create a UI that requires teachers to mentally stitch together subject-unit, interdisciplinary, and project flows from unrelated pages.

## Testing and verification
- Produce a slice checklist in the repo proving all prerequisites from Phase 3 are present.
- Add smoke tests or checklists covering route existence, live data loading, and major role visibility for MYP slice entry points.

## Feature flags / rollout controls
- Use `ib_myp_vertical_slice_v1` as the umbrella flag.
- Keep project/service/ interdisciplinary sub-flags available if the slice must be debugged progressively.

## Acceptance criteria
- There is a clear, approved implementation map for the MYP slice.
- The next MYP tasks can execute without re-litigating slice boundaries.

## Handoff to the next task
- Task 43 begins the live route, entry, and creation path for the MYP slice.
