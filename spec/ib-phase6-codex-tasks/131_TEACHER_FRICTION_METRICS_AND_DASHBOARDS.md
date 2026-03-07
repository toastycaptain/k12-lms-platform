# Task 131 — Teacher friction metrics and dashboards

## Major step context

This task belongs to **Step 7 — Add operational analytics that measure teacher friction**.

### Step goal
Measure whether the IB workflows are materially easier to use by instrumenting time, steps, drop-offs, queue health, and turnaround times.

### Why this step exists now
You want objective evidence that this platform improves on the friction patterns people dislike in older products.

## Objective

Measure teacher effort across the most important IB workflows so the team can prove lower friction and target the worst bottlenecks.

## Dependency position

- 130

## Primary repo areas to inspect and modify

- `/apps/core/app/services/ib/home`
- `/apps/core/app/services/ib/evidence`
- `/apps/web/src/features/ib/reports`
- `/apps/web/src/features/ib/home`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Define teacher friction metrics such as time to first unit edit, save completion latency, time from evidence upload to validation, time from story draft to publish, and number of return-with-comments loops.
- Compute or aggregate these metrics using a mix of backend event data and authoritative workflow timestamps.
- Build role-appropriate dashboards or report panels that surface trends, medians, backlog, and outliers without exposing sensitive content details.
- Include segmentation by programme (PYP/MYP/DP), school, and possibly specialist versus homeroom/subject teacher roles where useful.
- Highlight actionable friction points (for example, a spike in save latency or unusually slow review turnarounds) rather than only aggregate totals.
- Validate metrics with at least one manual spot-check to ensure event semantics match real workflow behaviour.

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

- Teacher-friction metric definitions and aggregations.
- Dashboard/report surfaces for teacher workflow health.
- Validation notes proving metric plausibility.

## Acceptance criteria

- You can answer whether common teacher actions are getting faster or slower over time.
- Metrics are segmented enough to identify where pain is concentrated.
- Dashboards prioritise actionable signals over vanity counts.
- The team can compare the product's workflow friction against internal targets.

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

- Do not use analytics to surveil individual teachers unfairly; focus on workflow health and support needs.
- Avoid brittle metrics that depend on one frontend click path only.
- Keep dashboards understandable by non-analysts.
