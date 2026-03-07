# Task 138 — Offline, resume, optimistic UI, and recovery patterns

## Major step context

This task belongs to **Step 8 — Expand mobile and quick-action parity**.

### Step goal
Make the two-minute teacher/coordinator/specialist actions excellent on mobile and small screens without over-promising full desktop parity.

### Why this step exists now
Real school adoption depends on handling triage, approvals, evidence, and publishing from phones or tablets in the hallway or between classes.

## Objective

Make mobile and intermittent-network usage trustworthy by standardising draft persistence, optimistic updates, pending state, retry, and recovery UX patterns.

## Dependency position

- 137

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib/mobile`
- `/apps/web/src/lib`
- `/apps/web/src/features/ib/shared`
- `/apps/core/app/controllers/api/v1/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Audit current autosave, pending mutation, and error-to-retry behaviour across the key quick-action surfaces; identify inconsistent patterns.
- Choose standard UI states for pending, sent, retrying, failed, offline queued, and reconciled actions.
- Persist enough local state for small pending drafts or actions so a user can resume after app switch, browser refresh, or short offline periods.
- Ensure optimistic updates are only used where the rollback UX is well-defined; otherwise prefer explicit pending state.
- Add recovery guidance when the backend rejects an action after local optimism (for example, permission change or state drift).
- Test common interruption scenarios in both manual QA and automated coverage where practical.

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

- A standard set of mobile mutation/recovery patterns.
- Implementation across priority quick-action surfaces.
- QA/test coverage for interruption and retry scenarios.

## Acceptance criteria

- Users can tell whether a mobile action is pending, successful, retrying, or failed.
- Short interruptions do not silently lose work on priority surfaces.
- Optimistic UI is used intentionally and recoverably.
- Error recovery language tells users what to do next.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Prioritise high-frequency, low-duration tasks first.
- Do not force full planning studios into cramped layouts prematurely.
- Offline/retry behaviour must be explicit and trustworthy.

## Task-specific guardrails / non-goals

- Do not fake offline support where the product cannot recover safely.
- Avoid silent local queues with no visible pending state.
- Keep the pattern library consistent across roles/surfaces.
