# Task 103 — IB pack freeze, feature-flag bundle, and pilot baseline tagging

## Major step context

This task belongs to **Step 1 — Lock down build integrity and release discipline**.

### Step goal
Turn the current IB implementation into a reproducible pilot baseline with clean source integrity, stable CI, frozen runtime contracts, and explicit rollback/release controls.

### Why this step exists now
The product now has broad IB coverage. The main risk is no longer missing features; it is shipping or iterating on top of an unstable build, partial export, or inconsistent pack/runtime state.

## Objective

Freeze the active IB runtime contract for pilot tenants by pinning pack versions, defining a coherent feature-flag bundle, and tagging a baseline release state.

## Dependency position

- 102

## Primary repo areas to inspect and modify

- `/packages/contracts/curriculum-profiles`
- `/apps/core/app/models/feature_flag.rb`
- `/apps/core/app/models/curriculum_profile_release.rb`
- `/apps/core/app/services/curriculum`
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
- Audit which IB pack version is currently effective across the pilot pathways and identify any stale document versions or runtime lookups still hitting older pack metadata.
- Define the exact pilot feature-flag bundle: which IB surfaces, jobs, readiness modules, and exports must be enabled; which unfinished or risky flags must remain off.
- Add or update code and seed data so a tenant/school can be placed into a known 'IB pilot baseline' state with one explicit operation rather than ad hoc toggling.
- Tag or document the canonical pilot baseline release/commit/pack version combination so it can be referenced in support and rollout materials.
- Where documents store pack, schema, or workflow references, verify new records created in pilot mode always pin the expected active values.
- Expose enough metadata via admin or readiness surfaces so operators can verify the current pack version and feature-flag bundle without shell access.

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

- A frozen pilot IB pack/version definition.
- A named feature-flag bundle or configuration mapping for pilot schools.
- Tagged baseline documentation and, if appropriate, seed or setup helpers for applying it.

## Acceptance criteria

- Pilot tenants can be placed into a deterministic IB baseline state with the intended pack version and flags.
- The active pack version is visible to operators and not inferred indirectly.
- Newly created pilot IB records pin the correct schema/workflow metadata.
- There is no ambiguity about what constitutes the sanctioned pilot baseline.

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

- Do not create a new pack version unless required; prefer operationalising the strongest current pack.
- Do not leave hidden environment-specific overrides that bypass the feature-flag bundle.
- Keep the bundle documented at both technical and operator levels.
