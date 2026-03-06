# Task 89 — Mobile Triage, Offline Resume, and 'Changed Since Last Visit'

## Phase step
5 — Productionize evidence, publishing, and notifications

## Purpose
Address the day-to-day mobile and interruption realities that often make teacher apps frustrating.
This task focuses on resilient triage flows, offline/poor-network behavior, and explicit 'changed
since last visit' signals.

## Current repo anchors
- `apps/web/src/lib/offlineMutationQueue.ts`
- `apps/web/src/lib/api-poll.ts`
- `apps/web/src/lib/api-stream.ts`
- `apps/web/src/features/ib/data.ts`

## Deliverables
- Reliable mutation queue behavior for mobile triage actions.
- 'Changed since last visit' support for queues and console cards using persisted seen-state logic.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Return change markers or updated timestamps sufficient for last-seen comparisons.
- Where needed, add incremental feed endpoints or event timestamps rather than forcing the frontend to diff huge payloads.

### 3) Frontend work
- Use the existing offline queue infrastructure to support safe retries of low-risk inbox/publishing actions.
- Persist last-seen markers by school and user so 'changed since last visit' is meaningful.
- Design degraded/offline states explicitly on mobile surfaces.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Offline/retry tests using mocked network failure.
- Tests for changed-since-last-visit indicators respecting school context.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Simulate network failure or duplicate action submission and verify idempotent behavior.
- Verify timestamps, status transitions, and audit visibility after publishing-related actions.

### 8) Acceptance criteria
- The IB operational surfaces remain usable when the network is flaky or the user returns later.

### 9) Pitfalls and guardrails
- Do not queue destructive or high-risk actions offline without clear safety review.

### 10) Handoff to the next task

Before moving to Task 90, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
