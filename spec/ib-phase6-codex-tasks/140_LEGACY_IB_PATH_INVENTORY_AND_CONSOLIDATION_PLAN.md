# Task 140 — Legacy IB path inventory and consolidation plan

## Major step context

This task belongs to **Step 9 — Complete the document-system consolidation**.

### Step goal
Finish converging IB workflows onto CurriculumDocument, CurriculumDocumentVersion, PlanningContext, and IB operational models so the IB side has one authoritative architecture.

### Why this step exists now
Pilot hardening is undermined if legacy planning pathways still leak into IB routes, workflows, or data ownership.

## Objective

Identify every remaining place where IB mode still depends on older planning paths, generic surfaces, or duplicated logic so consolidation can be executed safely.

## Dependency position

- 139

## Primary repo areas to inspect and modify

- `/apps/core/app/models`
- `/apps/core/app/controllers/api/v1`
- `/apps/web/src/app`
- `/apps/web/src/features/ib`
- `/apps/web/src/features/curriculum`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Inventory all IB routes, links, services, and mutations that still touch legacy `UnitPlan`, `LessonPlan`, `Template`, or older workflow engines rather than the document system.
- Map where generic curriculum pages still leak IB users back into non-IB route trees or editors.
- Identify duplicated models/services where IB-specific flows and generic planning logic overlap confusingly.
- Classify each dependency as keep temporarily, redirect, migrate, adapter-wrap, or remove.
- Produce a consolidation sequence that minimises user-facing breakage and keeps deep links valid.
- Highlight data backfill requirements created by the inventory.

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

- A legacy dependency inventory and consolidation plan.
- A prioritised list of redirect/migration/removal actions.

## Acceptance criteria

- The team has a concrete map of what still prevents IB from being fully document-system-native.
- Every remaining legacy dependency has a proposed treatment.
- The consolidation plan sequences risky changes sensibly.
- Frontend and backend inventories align.

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

- Do not start deleting legacy paths before the inventory is complete.
- Avoid assuming something is unused just because IB has newer surfaces.
- Keep user-facing deep links and historical data in scope.
