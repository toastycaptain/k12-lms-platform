# Task 81 — Review Governance Frontend Operations Views

## Phase step
3 — Build the real IB admin/coordinator governance layer

## Purpose
Render the coordinator/admin review governance experience using the backend exception queues and
metrics. The UI should feel like a decision-support console, not a generic report table.

## Current repo anchors
- `apps/web/src/features/ib/data.ts`
- `apps/web/src/app/ib/`

## Deliverables
- Operations views for approvals, moderation, returned-with-comments, orphaned records, and SLA breaches.
- Batch-oriented action affordances where safe (open next, assign owner, request follow-up, export list).

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 3) Frontend work
- Use dedicated queue panels and filters per programme.
- Surface 'what changed since last visit' for coordinators so repeat review work is low-friction.
- Preserve deep links and back-navigation into the queue after opening a record.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Interaction tests for filters, deep-link returns, and queue state changes.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- A coordinator can understand where their attention is needed in minutes, not by opening many pages manually.

### 9) Pitfalls and guardrails
- Do not rebuild a cluttered grid. Prioritize actionability and exception-first design.

### 10) Handoff to the next task

Before moving to Task 82, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
