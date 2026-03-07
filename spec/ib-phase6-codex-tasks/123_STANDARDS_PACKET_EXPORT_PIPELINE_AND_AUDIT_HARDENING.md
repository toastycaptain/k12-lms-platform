# Task 123 — Standards packet export pipeline and audit hardening

## Major step context

This task belongs to **Step 5 — Harden the background-job and notification layer**.

### Step goal
Make publishing, digest scheduling, exports, and notifications deterministic, idempotent, observable, and recoverable.

### Why this step exists now
Pilot schools will experience the product as unreliable if background operations are slow, duplicated, or silently failing.

## Objective

Turn standards packet export into a dependable production pipeline with real artifacts, queue status, snapshotting, and audit coverage.

## Dependency position

- 122

## Primary repo areas to inspect and modify

- `/apps/core/app/models/ib_standards_packet.rb`
- `/apps/core/app/models/ib_standards_export.rb`
- `/apps/core/app/services/ib/standards`
- `/apps/web/src/features/ib/standards`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Audit the current standards export flow and replace any placeholder status flips with actual export job orchestration and artifact persistence.
- Ensure exports snapshot the relevant evidence/packet state so operators know what exactly was exported at that moment.
- Add statuses such as queued, generating, generated, failed, superseded, and archived, with actor/time metadata.
- Provide download links, retry semantics, and audit trails from both packet detail and admin support views.
- Handle export failure scenarios gracefully, including missing attachments or packet incompleteness, without corrupting packet state.
- Add tests that cover export generation, repeated export, failed export, and permissions around download/retry.

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

- A real standards export pipeline with persisted artifacts.
- Improved packet/export status modelling and UI surfaces.
- Audit and test coverage for export lifecycle.

## Acceptance criteria

- Standards packet export produces actual artifacts and audit history.
- Operators can see which packet snapshot was exported and when.
- Retries do not overwrite or confuse prior export history silently.
- Failures are diagnosable and visible without reading raw logs.

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

- Do not treat exports as opaque side effects with no durable model.
- Avoid coupling export generation too tightly to immediate request/response timing.
- Preserve historical export records rather than mutating them invisibly.
