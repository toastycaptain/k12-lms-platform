# Task 122 — Publishing queue, digest scheduler, and retry hardening

## Major step context

This task belongs to **Step 5 — Harden the background-job and notification layer**.

### Step goal
Make publishing, digest scheduling, exports, and notifications deterministic, idempotent, observable, and recoverable.

### Why this step exists now
Pilot schools will experience the product as unreliable if background operations are slow, duplicated, or silently failing.

## Objective

Make family publishing and digest scheduling reliable, inspectable, and safe to retry under load or partial failure.

## Dependency position

- 121

## Primary repo areas to inspect and modify

- `/apps/core/app/models/ib_publishing_queue_item.rb`
- `/apps/core/app/services/ib/publishing`
- `/apps/core/app/jobs`
- `/apps/web/src/features/ib/families`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Audit the lifecycle of publishing queue items and digest schedules from draft through dispatch, including all status transitions and failure states.
- Ensure queue items expose deterministic terminal and retryable states, with timestamps and failure reasons suitable for UI display.
- Harden digest scheduling so duplicate or overlapping runs do not spam families or create conflicting queue transitions.
- Add retry/recovery semantics that distinguish safe automatic retries from operator-approved manual retries.
- Update the frontend publishing queue views so operators can see last attempt, next retry, failure reason, and whether retry is safe.
- Write job/service/request tests around duplicate scheduling, partial failure, visibility change after enqueue, and held-back items.

### 3. Contracts, data, and permissions
While implementing, verify the following:
- tenant, district, school, and programme scoping remain correct
- pack/version/workflow metadata is preserved where the task touches documents or operational records
- audit logging remains intact for sensitive operator mutations
- backend/frontend terminology remains aligned with the active IB experience
- any shared-layer extraction stays pack-neutral unless this task is explicitly IB-only

### 4. Tests and verification
Add or update the right test types for the surface you changed:
- backend request/service/model/job specs in `apps/core/spec`
- frontend unit/integration tests in `apps/web`
- Playwright coverage where the task changes critical cross-page behaviour
- manual smoke notes if the task touches operator workflows that are awkward to automate immediately

Do not treat ad hoc manual clicking as sufficient if the task changes high-risk pilot behaviour.

### 5. Documentation and operator clarity
Update the relevant runbooks, QA notes, or inline product copy where the user/operator experience changes. If the task introduces a new status vocabulary, retry rule, or admin action, document it where support staff and future Codex phases will find it.

## Required deliverables

- More reliable publishing queue and digest processing logic.
- UI improvements exposing deterministic queue state.
- Tests covering common failure and retry patterns.

## Acceptance criteria

- Publishing/digest operations are idempotent and inspectable.
- Families do not receive duplicate content because of retry behaviour.
- Teachers/coordinators can understand queue state without checking logs.
- Failure reasons and retry eligibility are visible in the UI.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Every background mutation must be safe to retry.
- Queue state should be inspectable by admins and coordinators.
- Visibility or audience changes require audit coverage.

## Task-specific guardrails / non-goals

- Do not hide all failures behind background auto-retry with no operator visibility.
- Keep queue status vocabulary consistent between backend and frontend.
- Avoid digest scheduling logic that assumes one simple cadence for all schools.
