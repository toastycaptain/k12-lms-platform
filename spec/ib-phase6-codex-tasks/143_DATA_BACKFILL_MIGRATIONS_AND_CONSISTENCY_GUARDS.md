# Task 143 — Data backfill migrations and consistency guards

## Major step context

This task belongs to **Step 9 — Complete the document-system consolidation**.

### Step goal
Finish converging IB workflows onto CurriculumDocument, CurriculumDocumentVersion, PlanningContext, and IB operational models so the IB side has one authoritative architecture.

### Why this step exists now
Pilot hardening is undermined if legacy planning pathways still leak into IB routes, workflows, or data ownership.

## Objective

Backfill or normalise historical IB records so document-system consolidation is reflected in real data, not just in new-record code paths.

## Dependency position

- 142

## Primary repo areas to inspect and modify

- `/apps/core/db/migrate`
- `/apps/core/app/services/ib/migration`
- `/apps/core/app/models`
- `/apps/core/spec`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Identify historical records missing document version links, route hints, pack pins, planning-context associations, collaborator ownership, or operational-record relationships needed by the consolidated system.
- Create migrations or backfill jobs that repair these records incrementally and safely, with logging and resume support if data volume is large.
- Add consistency guards/validators so new writes cannot recreate the same incomplete states.
- Report on backfill coverage and residual exceptions, ideally exposed in support/readiness tooling.
- Test both backfill logic and guard behaviour against representative old/new records.

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

- Backfill scripts/jobs/migrations for consolidated IB data.
- Consistency guards preventing regression.
- Reporting on backfill success and exceptions.

## Acceptance criteria

- Historical IB records needed for pilot use are compatible with the consolidated document system.
- New writes cannot silently create missing-link states the backfill had to repair.
- Backfill execution is observable and resumable.
- Residual exceptions are visible rather than hidden.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Consolidation must preserve audit history and route compatibility.
- Avoid breaking existing deep links; redirect or backfill instead.
- Document-system changes must be observable and reversible during rollout.

## Task-specific guardrails / non-goals

- Do not mutate published/historical records blindly without preserving audit meaning.
- Avoid one giant destructive migration when a resumable job is safer.
- Document any records intentionally left unmigrated and why.
