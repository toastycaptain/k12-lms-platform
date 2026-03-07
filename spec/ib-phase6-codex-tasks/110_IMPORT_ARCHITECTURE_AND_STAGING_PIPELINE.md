# Task 110 — Import architecture and staging pipeline

## Major step context

This task belongs to **Step 3 — Build migration and import tooling**.

### Step goal
Provide safe, previewable, auditable import pathways so pilot schools can bring in programme structures and historical planning data without starting from zero.

### Why this step exists now
Schools evaluating replacement of legacy systems need proof that they can move data in incrementally and safely.

## Objective

Create the backend architecture for imports as staged, reviewable operations rather than one-off scripts that mutate live data directly.

## Dependency position

- 109

## Primary repo areas to inspect and modify

- `/apps/core/app/models`
- `/apps/core/app/services/ib/migration`
- `/apps/core/db/migrate`
- `/apps/core/app/jobs`
- `/apps/core/spec/services/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Introduce a first-class import domain if missing: import batch/session, source file, staging records, mapping decisions, validation results, dry-run reports, and execution outcomes.
- Design imports as multi-phase operations: upload/parse, stage, map, validate, dry-run, execute, and audit.
- Choose storage patterns for raw files and staged rows that preserve troubleshooting ability without leaking sensitive content unnecessarily.
- Ensure imports can target school/programme/academic-year scopes safely and cannot accidentally cross tenants or schools.
- Define how imports create `CurriculumDocument`, `PlanningContext`, `PypProgrammeOfInquiry`, `IbOperationalRecord`, and related entities without bypassing pack/version pinning or audit requirements.
- Plan background-job involvement for large imports so the UI remains responsive while preserving status transparency.

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

- Import batch/session models or equivalent architecture.
- Migration(s) and service boundaries for staged imports.
- Tests or design artifacts proving the phased pipeline.

## Acceptance criteria

- Imports are represented in durable application state, not ad hoc scripts.
- Every import has a scope, status, audit story, and raw/staged provenance.
- The architecture supports dry-run and rollback before live execution.
- Large imports can be processed asynchronously with visible status.

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

- Do not jump straight to parser code without first defining import lifecycle state.
- Avoid direct writes into final tables from file parsing code.
- Keep the import domain generic enough to support later American/British imports.
