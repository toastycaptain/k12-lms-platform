# Task 80 — Review Governance Backend Queues, SLA, and Exception Logic

## Phase step
3 — Build the real IB admin/coordinator governance layer

## Purpose
Backend-enable coordinator governance by computing pending approvals, moderation load, returned-
with-comments patterns, bottlenecks by workflow state, and SLA breach risk. This turns the
operations center from a visual board into a decision-support system.

## Current repo anchors
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/ib_document_comment.rb`
- `apps/core/app/models/ib_document_collaborator.rb`
- `apps/core/app/models/ib_operational_record.rb`
- `apps/core/app/models/ib_programme_setting.rb`

## Deliverables
- Backend exception queues and summary metrics for coordinator review governance.
- Query filters by programme, school, workflow state, owner, reviewer, and SLA state.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Define review governance metrics such as time in state, returned count, unresolved comments, ownerless records, missing advisor coverage, and overdue coordinator actions.
- Use programme settings thresholds from Task 76 where appropriate.
- Expose both summary cards and queue rows with route-ready entity refs.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Spec coverage for SLA calculations and queue filtering.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- The backend can identify bottlenecks and exception records without the frontend calculating business logic.

### 9) Pitfalls and guardrails
- Do not encode SLA logic only in JavaScript; it must live in the backend for consistency.

### 10) Handoff to the next task

Before moving to Task 81, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
