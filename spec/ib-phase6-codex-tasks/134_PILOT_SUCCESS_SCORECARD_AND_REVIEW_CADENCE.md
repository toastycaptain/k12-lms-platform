# Task 134 — Pilot success scorecard and review cadence

## Major step context

This task belongs to **Step 7 — Add operational analytics that measure teacher friction**.

### Step goal
Measure whether the IB workflows are materially easier to use by instrumenting time, steps, drop-offs, queue health, and turnaround times.

### Why this step exists now
You want objective evidence that this platform improves on the friction patterns people dislike in older products.

## Objective

Translate instrumentation into an operational scorecard and regular review process that guides decisions during the pilot period.

## Dependency position

- 133

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib/admin`
- `/docs`
- `/apps/core/app/services/ib/support`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Define the handful of metrics that represent pilot success: setup completion, workflow completion rates, publish reliability, export reliability, review turnaround, mobile quick-action usage, and friction trend indicators.
- Build a scorecard view or report that aggregates those metrics by school/programme and over time.
- Document the review cadence: daily during launch week, weekly during early pilot, and threshold-triggered reviews for severe issues.
- Add support for commentary/notes or status interpretation so operators can contextualise score changes.
- Ensure scorecard metrics link back to the source dashboards/queues for action.
- Tie scorecard outcomes to go/no-go decisions for expanding the pilot or beginning cross-curriculum extraction.

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

- A pilot success scorecard surface.
- A documented review cadence and decision rubric.
- Links from scorecards into operational drill-downs.

## Acceptance criteria

- Pilot stakeholders can answer 'is the pilot healthy?' from one place.
- Scorecard review is tied to a real recurring cadence.
- Metrics on the scorecard are actionable and traceable to deeper data.
- The team has a shared definition of pilot success and concern.

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

- Do not turn the scorecard into a giant dashboard clone.
- Avoid opaque composite scores with no explanation.
- Keep the scorecard tightly aligned to pilot decisions.
