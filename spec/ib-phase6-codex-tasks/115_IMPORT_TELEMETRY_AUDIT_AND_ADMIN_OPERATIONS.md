# Task 115 — Import telemetry, audit, and admin operations

## Major step context

This task belongs to **Step 3 — Build migration and import tooling**.

### Step goal
Provide safe, previewable, auditable import pathways so pilot schools can bring in programme structures and historical planning data without starting from zero.

### Why this step exists now
Schools evaluating replacement of legacy systems need proof that they can move data in incrementally and safely.

## Objective

Make imports observable and operable in production with telemetry, audit logs, status dashboards, and support controls.

## Dependency position

- 114

## Primary repo areas to inspect and modify

- `/apps/core/app/services/ib/support`
- `/apps/core/app/models/audit_log.rb`
- `/apps/web/src/features/ib/admin`
- `/apps/core/app/controllers/api/v1/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Emit structured telemetry for import lifecycle milestones: file uploaded, parsed, mapped, dry-run completed, executed, partially failed, rolled back, and archived.
- Ensure import mutations create auditable records tied to actor, scope, source file, and affected entities.
- Add admin-facing import history views with filters by status, school, domain, actor, and time range.
- Provide support actions such as download conflict report, reopen mapping session, retry failed background import step, or archive old batches safely.
- Surface import metrics in pilot readiness or support dashboards where appropriate.
- Document how imports interact with release discipline, rollback, and pilot launch rules.

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

- Telemetry/audit coverage for import operations.
- Import history/admin views and support actions.
- Documentation linking imports into pilot operations.

## Acceptance criteria

- Every import batch has a visible lifecycle and actor trace.
- Support/admin users can inspect past imports without engineering help.
- Import failures are diagnosable from telemetry and UI history.
- Import operations participate in the wider audit and readiness story.

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

- Do not log raw sensitive content unnecessarily in telemetry events.
- Avoid admin actions that mutate import state without leaving an audit trail.
- Keep import-history surfaces performant for long-running pilots.
