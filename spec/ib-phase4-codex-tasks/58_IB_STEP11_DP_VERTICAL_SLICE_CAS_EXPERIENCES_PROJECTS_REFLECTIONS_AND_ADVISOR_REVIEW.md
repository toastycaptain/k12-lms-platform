# Task 58 — IB STEP11 DP VERTICAL SLICE CAS EXPERIENCES, PROJECTS, REFLECTIONS, AND ADVISOR REVIEW

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 57
- **Run before:** Task 59 completes the coordinator-side DP operations and analytics loop
- **Primary mode:** Backend + Frontend

## Objective
Turn CAS into a real operational workflow in the DP slice: experiences, project designation, reflections, evidence, advisor review, completion signals, and student next actions.

## Why this task exists now
CAS is one of the most consequential DP workflows for day-to-day school operations. If the product cannot make it clear what is missing, approved, overdue, or complete, the DP side remains incomplete.

## Current repo anchors
- outputs from Tasks 26–27 and 53–57
- `apps/web/src/features/ib/dp/CasWorkspace.tsx`
- evidence subsystem
- CAS domain models/endpoints from Phase 3

## Scope
### In scope
- CAS overview per student
- experience and project records
- evidence and reflection linkage
- advisor review/comments/approval states
- completion progress and risk summaries
- linkage into coordinator and student dashboards

### Explicitly out of scope
- broad extracurricular management beyond CAS-specific needs

## Backend work
- Ensure CAS models support:
  - student ownership
  - experience vs project semantics
  - learning outcome or equivalent alignment if configured
  - reflection and evidence linkage
  - advisor review states and timestamps
  - completion/risk state and reason codes
- Add summary endpoints for advisor queues, student next actions, and coordinator completion/risk views.
- Keep visibility and audit boundaries explicit across student/advisor/coordinator/guardian roles.

## Frontend work
- Bind CAS workspaces to live data.
- Make reflection and advisor review flows contextual and low-friction.
- Show project designation and completion state clearly.
- Ensure students understand exactly what to do next without reading through dense policy language.

## UX / interaction rules
- prioritize “next required action” and recent review feedback
- distinguish pending reflection, pending advisor review, and approved/completed clearly
- keep advisor queues triage-friendly
- keep family-facing output curated rather than exposing raw operational detail

## Data contracts, APIs, and model rules
- CAS review state and completion signals must be queryable.
- Do not model advisor review solely as unstructured comments.
- Keep internal notes separate from any curated guardian-facing summary later.

## Risks and guardrails
- Do not make CAS another paperwork swamp.
- Do not require duplicate entry of evidence already captured elsewhere if linkage can solve it.
- Do not let completion/risk semantics differ across student, advisor, and coordinator views.

## Testing and verification
- Model/request tests for CAS creation, reflection, review, and completion/risk summaries.
- Frontend integration tests for student and advisor CAS flows.
- Permission tests across role boundaries.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`
- `ib_dp_cas_slice_v1`

## Acceptance criteria
- CAS is now a live, actionable workflow for students, advisors, and coordinators inside the DP slice.

## Handoff to the next task
- Task 59 completes the coordinator-side DP operations and analytics loop.
