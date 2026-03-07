# Task 137 — Coordinator, specialist, and advisor mobile triage

## Major step context

This task belongs to **Step 8 — Expand mobile and quick-action parity**.

### Step goal
Make the two-minute teacher/coordinator/specialist actions excellent on mobile and small screens without over-promising full desktop parity.

### Why this step exists now
Real school adoption depends on handling triage, approvals, evidence, and publishing from phones or tablets in the hallway or between classes.

## Objective

Support the high-value mobile triage actions for non-teacher roles: approvals, exception review, specialist contribution, and advisor follow-up.

## Dependency position

- 136

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib/review`
- `/apps/web/src/features/ib/specialist`
- `/apps/web/src/features/ib/dp`
- `/apps/web/src/features/ib/mobile`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Identify the coordinator actions that matter most on mobile: approve/return, review exception, view blocker detail, reroute ownership, inspect queue state.
- Optimise specialist flows for attaching or commenting on multiple units quickly, especially when moving between classes or spaces.
- Optimise advisor/coordinator DP follow-up tasks such as acknowledging checkpoint lag, updating brief note/status, or opening a deep link into a record.
- Preserve enough context on small screens so the user understands what record/programme they are touching without needing multiple back-and-forth navigations.
- Add responsive tests and role-specific QA coverage for these triage flows.

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

- Mobile-ready triage surfaces for coordinator/specialist/advisor actions.
- Role-aware responsive QA/test coverage.

## Acceptance criteria

- Coordinators and specialists can handle high-priority triage on mobile without opening a laptop.
- DP advisor follow-up actions are possible and understandable on small screens.
- Role context and record identity remain clear throughout the flows.
- The product does not expose desktop-only complexity when a quick action will do.

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

- Do not optimise obscure admin actions before the top triage tasks.
- Avoid mobile flows that hide review rationale or change target record context unexpectedly.
- Keep the number of critical mobile role actions intentionally limited and polished.
