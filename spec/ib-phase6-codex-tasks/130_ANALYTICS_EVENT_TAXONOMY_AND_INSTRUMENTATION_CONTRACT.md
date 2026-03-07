# Task 130 — Analytics event taxonomy and instrumentation contract

## Major step context

This task belongs to **Step 7 — Add operational analytics that measure teacher friction**.

### Step goal
Measure whether the IB workflows are materially easier to use by instrumenting time, steps, drop-offs, queue health, and turnaround times.

### Why this step exists now
You want objective evidence that this platform improves on the friction patterns people dislike in older products.

## Objective

Create the shared event model and instrumentation contract needed to measure IB workflow friction consistently across frontend and backend.

## Dependency position

- 129

## Primary repo areas to inspect and modify

- `/apps/web/src/lib`
- `/apps/web/src/features/ib`
- `/apps/core/app/services/ib/support/telemetry.rb`
- `/docs`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Define the canonical event taxonomy for IB pilot analytics: navigation, create/save, transition, approval, validation, publish, retry, export, setup, help usage, and mobile quick actions.
- Specify event payload fields, allowed dimensions, user-role context, school/programme context, and privacy constraints.
- Establish a contract for emitting events from frontend interactions versus backend authoritative milestones so metrics are not double-counted or ambiguous.
- Document naming conventions, versioning rules, and deprecation strategy for analytics events.
- Add shared helper utilities where needed so instrumentation is consistent and low-friction across the codebase.
- Identify which events are mandatory for Phase 6 dashboards and which can wait.

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

- A checked-in analytics taxonomy/contract document.
- Shared instrumentation helpers or wrappers.
- An event inventory tied to Phase 6 dashboards.

## Acceptance criteria

- Both frontend and backend teams have one source of truth for analytics event names and payloads.
- Critical teacher/coordinator/pilot-readiness flows have instrumentable event definitions.
- The contract prevents obvious double-counting or privacy drift.
- Future metrics work can build on a stable event vocabulary.

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

- Do not instrument everything; prioritise meaningful workflow milestones.
- Avoid unstable event names derived from transient UI copy.
- Keep personally sensitive educational content out of event payloads.
