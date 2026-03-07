# Task 146 — Governance, evidence, and readiness module extraction

## Major step context

This task belongs to **Step 10 — Shift to cross-curriculum extraction after pilot hardening**.

### Step goal
Identify and extract the platform primitives proven by IB so the next American/British maturity phases reuse strong shared modules instead of copying IB code.

### Why this step exists now
IB has been the hardest proving ground; the right next move is to harvest shared modules, not trap them inside IB-only implementations.

## Objective

Extract the most obviously reusable operational modules—governance, evidence/publishing infrastructure, and readiness engines—into cleaner shared seams.

## Dependency position

- 145

## Primary repo areas to inspect and modify

- `/apps/core/app/services/ib/governance`
- `/apps/core/app/services/ib/evidence`
- `/apps/core/app/services/ib/support`
- `/apps/web/src/features/ib/admin`
- `/apps/web/src/features/ib/evidence`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Choose one or more shared candidates from the inventory that are ripe for actual extraction now because the interfaces are already relatively clean.
- Refactor naming, folder boundaries, or service composition so the shared capability no longer lives under an IB-only namespace if it truly is generic.
- Keep IB adapters/modules that provide IB-specific vocabulary, rules, or UI composition layered on top of the shared base.
- Update imports/tests/docs so the extracted seams are clear and future curricula can consume them intentionally.
- Avoid over-extracting domain-specific details that still belong inside IB.

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

- Actual code extraction/refactor for selected shared modules.
- Updated tests and documentation proving the new boundary.

## Acceptance criteria

- At least one meaningful operational module now has a cleaner pack-neutral seam.
- IB-specific behaviour remains intact through adapters/configuration.
- The extraction reduces future cross-curriculum coupling instead of creating more indirection for no gain.
- Tests still pass with the new boundaries.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Do not start a full American or British feature wave inside this phase.
- Focus on extraction boundaries, contracts, and shared module candidates.
- Anything extracted from IB must remain pack-neutral at the shared layer.

## Task-specific guardrails / non-goals

- Do not rename everything just for aesthetic purity.
- Only extract modules that are sufficiently stable and truly reusable.
- Preserve backwards compatibility for current IB flows.
