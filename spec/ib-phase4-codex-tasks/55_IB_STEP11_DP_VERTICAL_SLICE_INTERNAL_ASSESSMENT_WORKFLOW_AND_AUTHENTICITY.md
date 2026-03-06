# Task 55 — IB STEP11 DP VERTICAL SLICE INTERNAL ASSESSMENT WORKFLOW AND AUTHENTICITY

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 54
- **Run before:** Task 56 extends the DP slice into Extended Essay supervision
- **Primary mode:** Backend + Frontend

## Objective
Make internal assessment records fully operational inside the DP slice: live checkpoints, teacher/student workflow, review state, due dates, blocked reasons, and authenticity-related checkpoints or confirmations where the product is expected to support them.

## Why this task exists now
IA management is one of the most operationally important DP workflows. If this remains shallow, coordinators and teachers will not trust the DP side of the product.

## Current repo anchors
- outputs from Tasks 26–27 and 54
- `apps/web/src/features/ib/dp/InternalAssessmentTracker.tsx`
- DP domain models/endpoints for IA records and checkpoints
- student and coordinator views that will consume IA risk and next-action state

## Scope
### In scope
- IA list / queue / detail route
- teacher and student checkpoint flow
- due-date and overdue state
- feedback / review notes / return-for-action state
- authenticity-related checkpoints or confirmations appropriate to the product scope
- linkage from course map and coordinator console

### Explicitly out of scope
- external plagiarism tooling or full external assessment platform integration

## Backend work
- Finalize IA models/workflows so they support:
  - checkpoint progression
  - student submission/update state
  - teacher review state
  - authenticity check/confirmation state where applicable
  - risk reason codes (missing draft, overdue, awaiting teacher, awaiting student, authenticity issue, etc.)
- Expose summary and detail endpoints for teacher queues, student next actions, and coordinator oversight.
- Keep authenticity and internal review notes auditable and role-scoped.

## Frontend work
- Bind IA dashboards and detail pages to live data.
- Show next actions and blocked reasons clearly.
- Support teacher review and student follow-up without page-maze navigation.
- Make it obvious how IA status rolls up to coordinator risk views and student dashboards.

## UX / interaction rules
- keep queue rows compact and meaningful
- distinguish “awaiting student” vs “awaiting teacher” vs “awaiting confirmation” cleanly
- keep authenticity-related UI serious but not intimidating or overly legalistic
- do not bury due dates and overdue state

## Data contracts, APIs, and model rules
- Keep checkpoint and risk fields queryable; do not hide them in opaque blobs.
- Preserve audit trails for review notes and confirmations.
- Keep family visibility of IA states separate from internal detail; the guardian view will be handled later with appropriate summarization.

## Risks and guardrails
- Do not model IA as a static checklist with no clear current state.
- Do not expose authenticity notes too broadly.
- Do not create multiple conflicting “current status” values across queue, detail, and coordinator views.

## Testing and verification
- Model/request tests for IA transitions, reason codes, and role scoping.
- Frontend integration tests for teacher queue, IA detail, and student next-action rendering.
- Regression tests for coordinator roll-up consumption.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`
- `ib_dp_ia_slice_v1`

## Acceptance criteria
- IA workflow is live, auditable, actionable, and clearly visible to the right DP roles.

## Handoff to the next task
- Task 56 extends the DP slice into Extended Essay supervision.
