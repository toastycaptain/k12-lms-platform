# Task 52 — IB STEP11 DP VERTICAL SLICE MASTER PLAN

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 51
- **Run before:** Task 53 begins the live DP route, entry, and course-map launch path
- **Primary mode:** Backend + Frontend

## Objective
Define the exact scope, route model, domain boundaries, workflow boundaries, success metrics, and non-goals for the full-stack DP vertical slice.

## Why this task exists now
The DP slice is operationally heavier than MYP and easy to let sprawl. It spans teaching workspaces, IA operations, EE supervision, TOK checkpoints, CAS tracking, coordinator/advisor oversight, student next actions, and guardian support views. This task locks the slice into a coherent sequence.

## Dependencies from prior packs
- Phase 3 Tasks 09, 10, 26, and 27 established the pack/schema and initial live domain for DP objects.
- Evidence, family publishing, coordinator operations, and document-system work from prior phases already exist.

## Current repo anchors
- `apps/web/src/app/ib/dp/*`
- `apps/web/src/features/ib/dp/*`
- `apps/web/src/features/ib/home/*`
- `apps/core/app/models/*` for DP IA/EE/TOK/CAS records and curriculum documents
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor

## Scope
### In scope
- course-map and teaching-workspace entry
- internal assessment workflow and authenticity-related checkpoints
- extended essay supervision
- TOK workspace including exhibition/essay-related checkpoints as configured
- CAS experiences/projects/reflections/advisor review
- coordinator/advisor risk and completion oversight
- student next-action systems
- guardian/family support summaries
- release gates and telemetry

### Explicitly out of scope
- complete exam registration or external assessment integration work
- broad transcript generation or final report-card production
- non-DP programme work except regression protection

## Slice architecture note to produce in this task
Write and commit an architecture note covering:
- canonical route tree
- course map vs operational DP record relationships
- IA / EE / TOK / CAS lifecycle states and who owns each transition
- advisor/supervisor/coordinator/student/guardian role touchpoints
- risk scoring and overdue logic
- visibility boundaries for guardian-friendly views
- rollout flags and no-regression expectations

## Backend work
- Validate that required DP domain pieces exist and identify any missing relational/query pieces still needed for the slice.
- Add slice-level summary endpoints if they materially improve performance and simplicity for teacher/coordinator/student/guardian surfaces.
- Clarify where `CurriculumDocument` is the source of truth vs where dedicated operational models own the process.

## Frontend work
- Validate all DP deep links and launchers resolve to real routes.
- Identify the canonical DP teacher home / course-map / coordinator console / student dashboard entry points for the slice.
- Ensure the slice has one obvious golden-path journey from teaching plan to student/core operations.

## Data contracts, APIs, and model rules
- Define the golden path: create/open course map → operate teaching workspace → create/track IA → manage EE/TOK/CAS checkpoints → coordinator/advisor review and risk → student next actions → guardian support summaries.
- Define degraded states: what appears when students lack advisor assignments, records are late, or linked documents are incomplete.
- Clarify which DP artifacts should be visible to families and at what fidelity.

## Risks and guardrails
- Do not reduce DP to a bag of unrelated dashboard pages.
- Do not create opaque workflow states teachers and advisors cannot explain.
- Do not let guardian surfaces expose internal review or authenticity notes.

## Testing and verification
- Produce a DP slice checklist proving all required domain pieces from prior phases exist.
- Add smoke tests or route checks for all DP slice entry surfaces.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1` as umbrella
- keep IA / EE / TOK / CAS sub-flags available for safe rollout and debugging

## Acceptance criteria
- There is a clear, approved implementation map for the DP slice.
- The next DP tasks can execute without re-litigating scope.

## Handoff to the next task
- Task 53 begins the live DP route, entry, and course-map launch path.
