# Task 132 — Coordinator and admin operations analytics

## Major step context

This task belongs to **Step 7 — Add operational analytics that measure teacher friction**.

### Step goal
Measure whether the IB workflows are materially easier to use by instrumenting time, steps, drop-offs, queue health, and turnaround times.

### Why this step exists now
You want objective evidence that this platform improves on the friction patterns people dislike in older products.

## Objective

Instrument and visualise the operational health of approvals, readiness, publishing, standards packets, and review governance for coordinator/admin users.

## Dependency position

- 131

## Primary repo areas to inspect and modify

- `/apps/core/app/services/ib/governance`
- `/apps/core/app/services/ib/operations`
- `/apps/web/src/features/ib/admin`
- `/apps/web/src/features/ib/operations`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Define coordinator/admin metrics: approval turnaround, blocked readiness items, publishing queue backlog, export failure rate, stale packets, unowned review tasks, and setup completion lag.
- Build aggregation services or reporting endpoints that expose these metrics efficiently.
- Render dashboards/summary cards in the operations/readiness/admin consoles that emphasise exceptions and trends, not just totals.
- Allow filtering by programme, school, severity, and time range so support teams can compare pilot contexts.
- Make sure metrics link back to drill-down surfaces or filtered queues where the operator can act on what they see.
- Test the dashboards with realistic seeded data volumes to avoid slow queries or misleading empty states.

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

- Coordinator/admin metrics and dashboards.
- Filtering/drill-down behaviour tied to operational queues.
- Performance validation for reporting queries.

## Acceptance criteria

- Admins/coordinators can see operational bottlenecks without manually inspecting every queue.
- Metrics connect directly to action surfaces.
- Queries remain performant with realistic pilot data volumes.
- The dashboards differentiate setup, review, publishing, and export concerns clearly.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Analytics must respect permissions and privacy; avoid collecting unnecessary content-level data.
- Instrument events at stable workflow milestones, not ephemeral UI noise.
- Dashboards should drive action, not vanity metrics.

## Task-specific guardrails / non-goals

- Do not bury operators in dozens of graphs when a few decisive indicators will do.
- Avoid reports that cannot be drilled into or acted on.
- Keep metric semantics stable and documented.
