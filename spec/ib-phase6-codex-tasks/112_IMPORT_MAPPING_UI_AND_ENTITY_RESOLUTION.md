# Task 112 — Import mapping UI and entity resolution

## Major step context

This task belongs to **Step 3 — Build migration and import tooling**.

### Step goal
Provide safe, previewable, auditable import pathways so pilot schools can bring in programme structures and historical planning data without starting from zero.

### Why this step exists now
Schools evaluating replacement of legacy systems need proof that they can move data in incrementally and safely.

## Objective

Give admins a controlled UI for mapping imported rows to schools, users, planning contexts, document types, and existing records before execution.

## Dependency position

- 111

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib/admin`
- `/apps/web/src/app/ib/rollout`
- `/apps/core/app/controllers/api/v1/ib`
- `/apps/core/app/services/ib/migration`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Design a mapping interface that shows source fields, inferred targets, unresolved entities, duplicate candidates, and confidence/warning states.
- Allow reusable mapping presets where appropriate (for example, recurring staff-role or grade/year mappings), but make them reviewable before execution.
- Support entity resolution for schools, academic years, programmes, planning contexts, users/advisors, and document subtypes without requiring the admin to know internal IDs.
- Expose unresolved or ambiguous rows clearly and block execution until critical mappings are resolved.
- Include side panels or previews showing what target records will be created, updated, skipped, or linked.
- Add frontend tests around mapping state, conflict resolution, and persistence/resume of mapping sessions.

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

- A mapping/resolution UI for staged imports.
- Backend endpoints for mapping suggestions and persistence.
- Tests for common mapping workflows.

## Acceptance criteria

- An admin can complete or save partial mapping work without database access.
- Ambiguous rows are visible and actionable before execution.
- Mapping decisions persist across sessions and are auditable.
- The UI prevents silent creation of records against the wrong school/programme.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Every import path must support dry-run, validation preview, and rollback semantics.
- Imported records should land in draft or staged states unless explicitly published later.
- Avoid direct destructive overwrites of existing production data.

## Task-specific guardrails / non-goals

- Do not collapse all unresolved rows into one generic error counter.
- Avoid forcing fully manual mapping where deterministic inference is safe and explainable.
- Keep the UI usable on real import batches, not just toy examples.
