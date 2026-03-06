# Task 88 — Teacher Inbox and Publishing Queue Operationalization

## Phase step
5 — Productionize evidence, publishing, and notifications

## Purpose
Turn the teacher inbox and family publishing queue from polished UI into production workflows backed
by efficient APIs, deterministic states, and fast triage patterns.

## Current repo anchors
- `apps/web/src/features/ib/data.ts`
- `apps/web/src/app/ib/`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/useSchoolSWR.ts`

## Deliverables
- Operational teacher inbox and publishing queue pages/components backed by real APIs.
- Batch actions, refresh behavior, failure states, and state transitions that feel trustworthy.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 3) Frontend work
- Replace any remaining mock evidence/story queue data with live hooks.
- Support bulk validate, bulk request reflection, attach to story, hold, schedule, and publish-now actions where allowed.
- Make queue items display deterministic state transitions and timestamps rather than vague status labels.
- Preserve filters and scroll position across triage work so users can move fast.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Interaction tests for inbox filters, batch actions, and queue state changes.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Simulate network failure or duplicate action submission and verify idempotent behavior.
- Verify timestamps, status transitions, and audit visibility after publishing-related actions.

### 8) Acceptance criteria
- A teacher can process evidence and family publishing from dedicated operational surfaces without uncertainty about outcomes.

### 9) Pitfalls and guardrails
- Do not hide failed operations behind generic toast errors with no item-level feedback.

### 10) Handoff to the next task

Before moving to Task 89, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
