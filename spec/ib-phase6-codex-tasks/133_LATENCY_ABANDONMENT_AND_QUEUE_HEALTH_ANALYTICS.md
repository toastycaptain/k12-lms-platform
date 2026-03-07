# Task 133 — Latency, abandonment, and queue health analytics

## Major step context

This task belongs to **Step 7 — Add operational analytics that measure teacher friction**.

### Step goal
Measure whether the IB workflows are materially easier to use by instrumenting time, steps, drop-offs, queue health, and turnaround times.

### Why this step exists now
You want objective evidence that this platform improves on the friction patterns people dislike in older products.

## Objective

Add the system-level metrics that reveal hidden UX or operational pain: slow pages, abandoned workflows, and unhealthy asynchronous backlogs.

## Dependency position

- 132

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib`
- `/apps/core/app/services/ib/support/telemetry.rb`
- `/apps/core/app/jobs`
- `/apps/web/src/features/ib/reports`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Track page/workspace load times for the highest-value IB screens: teacher console, unit studios, evidence inbox, publishing queue, readiness console, standards packet detail.
- Measure abandonment points where users start but do not complete key flows such as setup steps, publish approval, mapping sessions, or review transitions.
- Collect queue health metrics including enqueue-to-start time, execution duration, retries, and failure backlog for publishing/import/export jobs.
- Surface these in a reliability/operations dashboard and, where useful, in the pilot readiness console.
- Correlate latency or queue-health issues with real workflow drop-offs to prioritise fixes intelligently.
- Define alert thresholds or watch thresholds for especially critical operations.

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

- Latency, abandonment, and queue-health metrics with dashboard surfaces.
- Threshold definitions for concerning degradation.
- Instrumentation covering the priority screens and jobs.

## Acceptance criteria

- The team can identify whether slow surfaces or job backlogs are impacting adoption.
- High-value workflows have measurable completion versus abandonment data.
- Queue health is visible in product/ops dashboards, not buried in infrastructure only.
- Thresholds exist for when to investigate pilot health issues.

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

- Do not collect session replay or content-level telemetry unless privacy review and business need are clear.
- Keep page performance metrics focused on actionable surfaces.
- Avoid hidden instrumentation that is impossible to interpret later.
