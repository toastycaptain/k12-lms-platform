# Task 124 — Notification fan-out, preferences, and deduplication

## Major step context

This task belongs to **Step 5 — Harden the background-job and notification layer**.

### Step goal
Make publishing, digest scheduling, exports, and notifications deterministic, idempotent, observable, and recoverable.

### Why this step exists now
Pilot schools will experience the product as unreliable if background operations are slow, duplicated, or silently failing.

## Objective

Make notification delivery coherent across roles by respecting preferences, deduplicating overlapping events, and clarifying why users were notified.

## Dependency position

- 123

## Primary repo areas to inspect and modify

- `/apps/core/app/models/notification.rb`
- `/apps/core/app/models/notification_preference.rb`
- `/apps/core/app/services/ib`
- `/apps/web/src/features/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Inventory notification-producing events across IB workflows: comments, approvals, reflection requests, publish decisions, queue failures, setup blockers, readiness alerts, and exports.
- Define deduplication rules so a user does not get multiple near-identical notifications from one underlying action or retry cycle.
- Respect per-role and per-user preferences where the current product already models them; extend the preference model if pilot users need finer control.
- Include message metadata that lets the UI explain what changed and where to go next, instead of generic 'something happened' alerts.
- Add tests around duplicate event emission, preference filtering, and actor-target combinations for teachers, coordinators, and guardians.
- Review notification UX copy for operational clarity and low noise.

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

- Notification event mapping and deduplication rules.
- Any required backend changes to preference or fan-out logic.
- Tests and copy updates for high-value IB notifications.

## Acceptance criteria

- Users no longer receive obvious duplicate alerts from one workflow action.
- Notification payloads contain actionable context and valid deep links.
- Preferences are honoured consistently across channels/surfaces.
- Notification logic is testable and understandable.

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

- Do not over-personalise or over-complicate preference surfaces before core dedupe works.
- Avoid silent notification suppression with no observability.
- Keep guardian notifications especially calm and intentional.
