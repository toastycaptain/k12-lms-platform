# Task 57 — IB STEP11 DP VERTICAL SLICE TOK WORKSPACE, EXHIBITION/ESSAY, AND CHECKPOINTS

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 56
- **Run before:** Task 58 operationalizes CAS experiences, projects, reflections, and advisor review
- **Primary mode:** Backend + Frontend

## Objective
Make the TOK workspace live and operational inside the DP slice, including the configured checkpoint structure for exhibition and essay-related work, teacher feedback, student next actions, and coordinator visibility.

## Why this task exists now
TOK easily becomes either too abstract or too fragmented in software. The slice should make TOK tangible as a sequence of checkpoints, deliverables, feedback, and student support.

## Current repo anchors
- outputs from Tasks 26–27 and 53–56
- `apps/web/src/features/ib/dp/TokWorkspace.tsx`
- TOK domain models/endpoints from Phase 3

## Scope
- live TOK route and record loading
- configurable checkpoint structures for exhibition / essay planning and completion as appropriate to the current school implementation
- teacher comments/feedback and return-for-action flows
- student next-action visibility
- coordinator summary/risk linkage

## Backend work
- Ensure TOK records support:
  - checkpoint rows and due dates
  - deliverable state
  - teacher feedback / return state
  - student next-action state
  - risk reason codes for coordinator summaries
- Add any tailored summary endpoints needed by TOK teacher queues or coordinator risk pages.
- Keep checkpoint visibility and note classes explicit.

## Frontend work
- Bind TOK workspace and queues to live data.
- Show the active deliverable/checkpoint and what the user should do next.
- Keep the TOK UI structured and calm, not an essay-management maze.
- Ensure student and teacher share a coherent mental model of the same record.

## UX / interaction rules
- use a clear timeline or phase-step pattern
- make teacher feedback and student response state obvious
- avoid heavy jargon in status labels
- keep coordinator-facing TOK risk concise and explorable

## Data contracts, APIs, and model rules
- Checkpoint state must be queryable for risk summaries.
- Keep teacher-only, student-visible, and family-visible content separated.
- Support school-specific TOK configuration through pack/schema rather than hardcoding one universal structure beyond the slice needs.

## Risks and guardrails
- Do not hard-code one TOK implementation so deeply that schools cannot adapt it.
- Do not flatten TOK progress to one vague percentage.
- Do not expose internal feedback or uncertainty notes in guardian surfaces later.

## Testing and verification
- Model/request tests for TOK checkpoint progression and role visibility.
- Frontend integration tests for teacher/student TOK workspaces.
- Coordinator summary tests consuming live TOK reason codes.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`
- `ib_dp_tok_slice_v1`

## Acceptance criteria
- TOK is live, actionable, and integrated into DP next-action and coordinator-risk systems.

## Handoff to the next task
- Task 58 operationalizes CAS experiences, projects, reflections, and advisor review.
