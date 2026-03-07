# Task 102 — Release candidate gates and deployment checklist

## Major step context

This task belongs to **Step 1 — Lock down build integrity and release discipline**.

### Step goal
Turn the current IB implementation into a reproducible pilot baseline with clean source integrity, stable CI, frozen runtime contracts, and explicit rollback/release controls.

### Why this step exists now
The product now has broad IB coverage. The main risk is no longer missing features; it is shipping or iterating on top of an unstable build, partial export, or inconsistent pack/runtime state.

## Objective

Define a formal IB pilot release gate with required checks, migration sequencing, feature-flag expectations, background job readiness, and deployment validation steps.

## Dependency position

- 101

## Primary repo areas to inspect and modify

- `/docs`
- `/tasks`
- `/apps/core/db/migrate`
- `/apps/core/config`
- `/apps/web/package.json`
- `/infrastructure`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Create a release candidate checklist that covers code freeze inputs, schema migration order, background job queues, asset builds, environment variable validation, feature flags, and pack pinning.
- Define which checks are blocking versus informational: unit/integration/e2e pass, queue health, readiness score thresholds, export smoke, pilot setup wizard smoke, and rollback artifact availability.
- Add a deployment validation section covering post-deploy smoke flows: log in as teacher/coordinator/admin, open core IB routes, validate a publishing queue item, and resolve a standards packet page.
- Specify how to handle data migrations that touch `CurriculumDocument`, `IbEvidenceItem`, `IbLearningStory`, standards packets, or pilot setup models so rollout order is explicit.
- Include storage and job-processing checks such as Active Storage availability, Sidekiq queue names, and Sentry/logging hooks for productionization concerns.
- If there is already an operations doc, fold the release gate into it rather than creating duplicate checklists.

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

- A checked-in release-candidate checklist or operations runbook.
- Any helper scripts or CI jobs needed to automate the gate.
- A post-deploy smoke checklist tied to the IB pilot baseline.

## Acceptance criteria

- There is one authoritative checklist for declaring an IB pilot release candidate.
- The checklist explicitly covers migrations, jobs, feature flags, pack state, route smoke, and rollback prerequisites.
- A release manager can execute the checklist without reverse engineering prior chat context.
- Deployment validation includes both teacher-facing and coordinator/admin-facing paths.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Do not introduce new IB feature scope in this step unless required to make release integrity measurable.
- Prefer small mechanical fixes over broad refactors.
- Treat git cleanliness, test determinism, and release repeatability as product requirements, not ops afterthoughts.

## Task-specific guardrails / non-goals

- Do not create a vague checklist that omits concrete commands or owners.
- Avoid duplicating the same gate in multiple files with conflicting wording.
- Treat background jobs and pack pinning as first-class release concerns.
