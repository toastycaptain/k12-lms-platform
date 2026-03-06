# Task 53 — IB STEP11 DP VERTICAL SLICE ROUTE TREE, COURSE MAP ENTRY, AND LAUNCHERS

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 52
- **Run before:** Task 54 binds the DP course map and teaching workspace to live records
- **Primary mode:** Backend + Frontend

## Objective
Make DP slice entry and route architecture fully real: canonical routes, course-map-aware launchers, and direct open/create flows for IA, EE, TOK, and CAS records from the right user contexts.

## Why this task exists now
DP users cannot waste time hunting for the correct record type. If launchers and routes are vague, the rest of the slice will inherit friction and trust problems.

## Current repo anchors
- `apps/web/src/app/ib/dp/*`
- `apps/web/src/features/ib/dp/*`
- generic document creation/route helpers
- DP coordinator console surfaces from prior phases
- teacher/student home surfaces that should deep-link into DP operations

## Scope
### Route tree to finalize
Implement or confirm canonical routes such as:
- `/ib/dp/course-maps/[documentId]`
- `/ib/dp/internal-assessments/[recordId]`
- `/ib/dp/ee/[eeRecordId]`
- `/ib/dp/tok/[tokRecordId]`
- `/ib/dp/cas/[studentId]` or `/ib/dp/cas/records/[recordId]` depending design
- `/ib/dp/coordinator`
- `/ib/dp/students/[studentId]/overview`

### Creation / entry flows to implement
- create/open course map from teacher console or course context
- create or seed IA from course map / course context
- open EE/TOK/CAS records from student/advisor/coordinator contexts
- fast-launch next-action routes from coordinator and student dashboards

## Backend work
- Ensure create/open endpoints accept and validate DP-specific metadata:
  - academic year
  - course / planning context
  - student assignment where relevant
  - advisor/supervisor linkage where relevant
  - record family (IA, EE, TOK, CAS)
- Return canonical identifiers and route metadata for direct landing.
- Add helper endpoints for “eligible students,” “assigned advisees,” “course-linked IA types,” or similar if the UX benefits.

## Frontend work
- Build DP-native launchers and quick-open components.
- Keep launcher language role-appropriate:
  - teachers think in courses and assessments
  - advisors think in student records and pending reviews
  - coordinators think in queues and risk items
  - students think in next actions and deadlines
- Remove generic/jargony dead ends from DP entry flows.

## UX / interaction rules
- remember recent course or student context where safe
- default launchers from next-action cards should land directly on the actionable record, not an overview page first
- show prerequisite warnings early (for example, missing supervisor assignment)

## Data contracts, APIs, and model rules
- Clarify which DP records are course-linked vs student-linked vs both.
- Keep route semantics stable and obvious; later tasks should not need to rewrite them.
- Ensure role-based authorization applies before route metadata is returned.

## Risks and guardrails
- Do not let the user choose among too many ambiguous DP record types with no guidance.
- Do not send students through teacher/coordinator entry paths.
- Do not make launchers dependent on brittle client-side assumptions about linked records.

## Testing and verification
- Request specs for create/open route metadata endpoints.
- Frontend integration tests for each launcher path and canonical route landing.
- Permission tests for teacher/advisor/coordinator/student contexts.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`
- `ib_dp_ia_slice_v1`, `ib_dp_ee_slice_v1`, `ib_dp_tok_slice_v1`, `ib_dp_cas_slice_v1`

## Acceptance criteria
- Users can open the right DP record from the right context and land directly on the live route with minimal friction.

## Handoff to the next task
- Task 54 binds the DP course map and teaching workspace to live records.
