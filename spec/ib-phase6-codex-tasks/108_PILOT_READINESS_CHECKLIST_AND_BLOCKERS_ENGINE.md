# Task 108 — Pilot readiness checklist and blockers engine

## Major step context

This task belongs to **Step 2 — Move into real pilot-school enablement**.

### Step goal
Convert pilot activation from an engineer-only set of commands into a governed product workflow for admins, coordinators, and support staff.

### Why this step exists now
A school should be able to stand up the IB experience through controlled setup flows, not ad hoc environment tweaks or manual data manipulation.

## Objective

Turn readiness into a transparent rules engine with explicit blockers, warnings, health checks, and remediation links that can power consoles and release decisions.

## Dependency position

- 107

## Primary repo areas to inspect and modify

- `/apps/core/app/services/ib/support`
- `/apps/core/app/controllers/api/v1/ib/pilot_readiness_controller.rb`
- `/apps/web/src/app/ib/readiness`
- `/apps/web/src/features/ib/admin`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Enumerate readiness rules across configuration, data, routes, jobs, exports, notifications, and review ownership; classify each as blocker, warning, or informational.
- Implement or harden the backend service that evaluates those rules and returns structured results with stable identifiers.
- Add explanation fields, remediation suggestions, and evidence links so every failed rule answers 'why' and 'how do I fix it?'.
- Render readiness as a living checklist with filterable severity, ownership, and last-checked timestamps.
- Support manual rerun and background refresh behaviours so operators know whether they are seeing stale or current readiness data.
- Ensure the readiness engine can be reused by release gates and support dashboards.

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

- A structured readiness rules engine with stable output schema.
- A frontend checklist/console for blockers and warnings.
- Refresh behaviour and timestamps that make staleness visible.

## Acceptance criteria

- Every pilot blocker can be traced to a concrete rule ID and remediation hint.
- The readiness console can be used by non-engineers to understand what remains before go-live.
- Rule evaluation output is reusable in automation and human-facing UIs.
- Stale readiness data is clearly marked and refreshable.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Pilot setup must be reversible and non-destructive.
- Keep every readiness computation explainable to admins/coordinators.
- Do not hide blockers behind optimistic success screens.

## Task-specific guardrails / non-goals

- Do not make readiness a black box score with no explanation.
- Keep rule identifiers stable so analytics and support references remain valid.
- Avoid overloading the UI with too many low-value informational checks.
