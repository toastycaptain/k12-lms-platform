# Task 87 — Publishing Jobs, Notifications, Digests, Idempotency, and Audits

## Phase step
5 — Productionize evidence, publishing, and notifications

## Purpose
Make family publishing reliable and auditable. Publishing must survive retries, scheduling, and
partial failures without duplicate sends or silent losses.

## Current repo anchors
- `apps/core/app/models/ib_learning_story.rb`
- `apps/core/app/models/ib_publishing_queue_item.rb`
- `apps/core/app/models/ib_publishing_audit.rb`
- `apps/core/app/models/feature_flag.rb`

## Deliverables
- Background jobs or service objects for publish-now, scheduled publish, digest generation, and hold/retry flows.
- Notification events and audit records covering publish decisions and outcomes.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Ensure publishing queue transitions are idempotent and safe to retry.
- Create notification events for evidence validation requests, reflection requests, publishing approvals, publish success/failure, and coordinator comments where needed.
- Implement digest scheduling with guardrails so families are not spammed if many stories become ready simultaneously.
- Add audit records for visibility changes and publication events.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Job/service tests for retry and duplicate-prevention behavior.
- Audit creation tests and notification event tests.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Simulate network failure or duplicate action submission and verify idempotent behavior.
- Verify timestamps, status transitions, and audit visibility after publishing-related actions.

### 8) Acceptance criteria
- Publishing outcomes are deterministic, retryable, and visible to coordinators/teachers.

### 9) Pitfalls and guardrails
- Do not let publish-now bypass the same audit and visibility safety checks as scheduled publishing.

### 10) Handoff to the next task

Before moving to Task 88, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
