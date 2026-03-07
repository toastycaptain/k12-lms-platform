# Task 104 — Rollback, recovery, and release operations

## Major step context

This task belongs to **Step 1 — Lock down build integrity and release discipline**.

### Step goal
Turn the current IB implementation into a reproducible pilot baseline with clean source integrity, stable CI, frozen runtime contracts, and explicit rollback/release controls.

### Why this step exists now
The product now has broad IB coverage. The main risk is no longer missing features; it is shipping or iterating on top of an unstable build, partial export, or inconsistent pack/runtime state.

## Objective

Design and implement the rollback/recovery mechanics required to back out a pilot release safely if a migration, export job, publishing operation, or route rollout misbehaves.

## Dependency position

- 103

## Primary repo areas to inspect and modify

- `/apps/core/app/jobs`
- `/apps/core/app/services/ib`
- `/apps/core/db/migrate`
- `/docs`
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
- Define rollback classes: code rollback, feature-flag rollback, pack rollback, migration/data remediation, export job replay, and publish queue recovery.
- For each class, document preconditions, safe triggers, operator ownership, and the exact commands or admin actions required.
- Add idempotent recovery operations where missing: replay exports, repopulate readiness snapshots, recalculate queue states, or disable risky features without data loss.
- Make sure long-running operations (exports, digests, backfills) leave enough audit breadcrumbs to know whether they can be retried or must be manually remediated.
- Add release-ops documentation for partial failure scenarios such as a successful web deploy with failed background workers, or a pack pin that succeeded for some schools but not others.
- Where appropriate, add admin-visible status surfaces or runbook references for recovery paths.

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

- A rollback and recovery runbook tied to the pilot baseline.
- Any missing replay/remediation tasks or commands.
- Operator-facing notes describing what can be rolled back instantly versus what requires data repair.

## Acceptance criteria

- There is a documented, executable rollback story for the highest-risk pilot operations.
- Critical background tasks and exports can be retried or recovered without manual database surgery.
- Support/admin users know how to diagnose partial rollout failures.
- Release operations no longer assume every deploy either succeeds completely or fails trivially.

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

- Do not over-engineer disaster recovery beyond the product's current deployment model.
- Focus on practical pilot rollback scenarios, not generic enterprise DR theatre.
- Every rollback path should preserve auditability.
