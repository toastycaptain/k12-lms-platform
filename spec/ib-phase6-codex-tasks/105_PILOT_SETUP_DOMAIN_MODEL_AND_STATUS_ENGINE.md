# Task 105 — Pilot setup domain model and status engine

## Major step context

This task belongs to **Step 2 — Move into real pilot-school enablement**.

### Step goal
Convert pilot activation from an engineer-only set of commands into a governed product workflow for admins, coordinators, and support staff.

### Why this step exists now
A school should be able to stand up the IB experience through controlled setup flows, not ad hoc environment tweaks or manual data manipulation.

## Objective

Define the canonical data model and state machine for setting up an IB pilot school or programme so readiness and onboarding logic has one source of truth.

## Dependency position

- 104

## Primary repo areas to inspect and modify

- `/apps/core/app/models`
- `/apps/core/app/services/ib/support`
- `/apps/core/app/services/ib/governance`
- `/apps/core/db/migrate`
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
- Audit existing readiness, rollout, programme settings, feature flag, and academic-year models to identify what already expresses pilot state and what is missing.
- Introduce or formalise a pilot setup domain concept if needed (wizard session, rollout state, prerequisite status records, or computed status service) without duplicating existing authoritative data.
- Define milestone states such as not started, in progress, blocked, ready for validation, ready for pilot, active, paused, and retired; decide which are stored versus computed.
- Model key prerequisite groups: tenant/school identity, academic year, active pack, feature-flag bundle, programme settings, planning contexts, roles/owners, notifications, guardian visibility, and export readiness.
- Expose a consistent status vocabulary that both backend and frontend can reuse in readiness checklists, admin consoles, and support reporting.
- Plan for school-level and programme-level setup variation so a district can onboard one school or multiple schools cleanly.

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

- Any new models/migrations or a documented computed-state service design.
- A canonical pilot status vocabulary shared across admin/readiness surfaces.
- An explicit mapping of prerequisite domains and ownership.

## Acceptance criteria

- Pilot setup state is no longer scattered across unrelated flags and inferred booleans.
- Frontend and backend can describe readiness using the same status model.
- The model supports at least school-level and programme-level scoping.
- A future support person can answer 'what is missing before go-live?' from the model/service.

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

- Prefer computed readiness where stored workflow state is unnecessary.
- Do not create a monolithic setup table that denormalises everything already stored elsewhere.
- Keep the model compatible with non-IB reuse later.
