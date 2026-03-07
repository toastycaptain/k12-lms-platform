# Task 113 — Dry-run validation, conflict reporting, and rollback

## Major step context

This task belongs to **Step 3 — Build migration and import tooling**.

### Step goal
Provide safe, previewable, auditable import pathways so pilot schools can bring in programme structures and historical planning data without starting from zero.

### Why this step exists now
Schools evaluating replacement of legacy systems need proof that they can move data in incrementally and safely.

## Objective

Implement the safety layer that previews import outcomes, reports conflicts precisely, and provides rollback semantics for executed imports.

## Dependency position

- 112

## Primary repo areas to inspect and modify

- `/apps/core/app/services/ib/migration`
- `/apps/core/app/jobs`
- `/apps/core/app/models`
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
- Define dry-run output classes: would create, would update, would skip, blocked, warning, duplicate, and irreversible concern.
- Make dry-run validation run against current live data and pack constraints so admins see realistic execution impact.
- Present row-level and aggregate conflict reports in the UI with filtering by severity, target domain, and blocking status.
- Design rollback semantics for executed imports: either compensate via audit journal entries, store created record IDs for reversal, or require draft-only imports that can be safely deleted before publication.
- Add explicit operator acknowledgement for risky updates (for example, linking imported items to existing documents with non-empty content).
- Ensure execution cannot proceed if blocking conflicts remain unresolved.

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

- Dry-run services and payloads.
- Conflict-reporting UI with drill-down.
- Rollback or compensation mechanisms appropriate to each import type.

## Acceptance criteria

- Admins can preview concrete import outcomes before executing anything.
- Blocking conflicts prevent execution and explain why.
- Executed imports leave enough metadata to reverse or compensate where promised.
- The system distinguishes safely importable draft content from risky updates.

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

- Do not label something reversible unless it truly is in the current data model.
- Avoid generic 'validation failed' output that hides row provenance.
- Keep import rollback logic aligned with audit/history requirements.
