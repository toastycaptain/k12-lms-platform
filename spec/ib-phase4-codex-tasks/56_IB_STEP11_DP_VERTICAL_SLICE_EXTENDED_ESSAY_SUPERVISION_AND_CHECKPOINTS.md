# Task 56 — IB STEP11 DP VERTICAL SLICE EXTENDED ESSAY SUPERVISION AND CHECKPOINTS

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 55
- **Run before:** Task 57 operationalizes the TOK workspace inside the slice
- **Primary mode:** Backend + Frontend

## Objective
Make the Extended Essay workflow live inside the DP slice: supervisor assignment, proposal/research question development, meeting/checkpoint logging, reflections/notes, overdue state, and coordinator visibility.

## Why this task exists now
EE supervision is one of the clearest places where DP platforms either shine or become bureaucratic. The product should help supervisors and coordinators know what is happening without generating unnecessary paperwork.

## Current repo anchors
- outputs from Tasks 26–27 and 53–55
- `apps/web/src/features/ib/dp/EeSupervisionWorkspace.tsx`
- EE domain models/endpoints from Phase 3

## Scope
- live EE route and record loading
- supervisor/student/coordinator views over the same underlying EE record
- checkpoint and meeting log workflows
- proposal/research question and milestone state
- overdue/risk reasons and next actions
- route linkage from coordinator console and student dashboard

## Backend work
- Ensure EE records support:
  - supervisor assignment
  - milestone/checkpoint rows with due dates/status
  - meeting/supervision notes where appropriate
  - student reflections or required updates where appropriate
  - risk reason codes and completion state
- Add tailored summary endpoints for supervisor queues and coordinator risk overviews if needed.
- Keep internal notes and student/guardian-visible content properly separated.

## Frontend work
- Bind the EE workspace to live data and roles.
- Present supervisor next actions clearly.
- Make history/recent updates visible without requiring separate pages for every checkpoint.
- Ensure student-facing EE progress is understandable and not drowned in staff-only metadata.

## UX / interaction rules
- favor timeline + next-action patterns over long form stacks
- make it easy to log supervision notes and checkpoint outcomes quickly
- keep risk status explorable: tell users why the record is late or blocked
- preserve calm and seriousness; EE is high stakes for students and staff

## Data contracts, APIs, and model rules
- Checkpoints and due dates should be relational/queryable for coordinator analytics.
- Supervision notes may need visibility classes (internal only vs student-visible summary).
- Avoid duplicated milestone state across multiple linked records.

## Risks and guardrails
- Do not turn EE into a wall of forms with no timeline clarity.
- Do not blur the line between private supervisor notes and student-facing feedback.
- Do not make coordinators infer EE risk from generic event logs.

## Testing and verification
- Model/request tests for EE checkpoint updates and role-specific visibility.
- Frontend integration tests for supervisor, coordinator, and student views.
- Risk-summary regression tests.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`
- `ib_dp_ee_slice_v1`

## Acceptance criteria
- The EE workflow is now live, trackable, role-aware, and usable as part of the DP slice.

## Handoff to the next task
- Task 57 operationalizes the TOK workspace inside the slice.
