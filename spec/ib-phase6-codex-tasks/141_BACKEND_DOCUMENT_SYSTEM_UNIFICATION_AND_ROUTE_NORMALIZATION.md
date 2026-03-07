# Task 141 — Backend document-system unification and route normalization

## Major step context

This task belongs to **Step 9 — Complete the document-system consolidation**.

### Step goal
Finish converging IB workflows onto CurriculumDocument, CurriculumDocumentVersion, PlanningContext, and IB operational models so the IB side has one authoritative architecture.

### Why this step exists now
Pilot hardening is undermined if legacy planning pathways still leak into IB routes, workflows, or data ownership.

## Objective

Finish the backend convergence so IB workflows resolve through `CurriculumDocument`, `CurriculumDocumentVersion`, `PlanningContext`, and canonical route helpers/services.

## Dependency position

- 140

## Primary repo areas to inspect and modify

- `/apps/core/app/models`
- `/apps/core/app/controllers/api/v1`
- `/apps/core/app/services/curriculum`
- `/apps/core/app/services/ib/support`
- `/apps/core/config/routes.rb`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Refactor or adapt remaining IB backend endpoints/services that still depend on legacy planning models for record lookup, save, workflow transition, or route hints.
- Ensure canonical route resolution and route generation come from one set of helpers/services that understand document types and operational record families.
- Unify workflow and pack/version pinning logic so IB documents and operational records resolve consistently through the active document system.
- Add redirect or adapter support where old endpoints/IDs must still resolve during transition.
- Expand request/service specs to prove legacy route resolution still reaches the correct new document-backed target.
- Document the new backend source-of-truth architecture for IB routing and documents.

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

- Updated backend services/controllers using the document system as the IB source of truth.
- Canonical route normalization with compatibility handling.
- Spec coverage for migrated behaviour.

## Acceptance criteria

- IB backend flows no longer depend on legacy planning objects for core behaviour.
- Canonical route helpers/services are authoritative and tested.
- Old links or identifiers resolve safely where promised.
- Document pinning and workflow logic are consistent across IB entities.

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

- Do not break external/internal deep links without a redirect path.
- Avoid massive simultaneous rewrites; prefer adapter and migration where safer.
- Keep multi-school scoping and permissions intact throughout refactors.
