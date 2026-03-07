# Task 142 — Frontend IB route redirects and editor-shell consolidation

## Major step context

This task belongs to **Step 9 — Complete the document-system consolidation**.

### Step goal
Finish converging IB workflows onto CurriculumDocument, CurriculumDocumentVersion, PlanningContext, and IB operational models so the IB side has one authoritative architecture.

### Why this step exists now
Pilot hardening is undermined if legacy planning pathways still leak into IB routes, workflows, or data ownership.

## Objective

Complete the frontend convergence so IB users stay inside IB-native shells while the underlying editor and fetch logic reuses shared document primitives cleanly.

## Dependency position

- 141

## Primary repo areas to inspect and modify

- `/apps/web/src/app/ib`
- `/apps/web/src/features/ib`
- `/apps/web/src/features/curriculum`
- `/apps/web/src/features/ib/shared`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Replace or redirect any remaining links that send IB users to generic plan routes when an IB-native document-backed route exists.
- Consolidate duplicate editor shells so IB surfaces wrap shared document editors consistently instead of forking logic unpredictably.
- Ensure route params, breadcrumbs, and context rails remain correct after redirect/consolidation changes.
- Preserve feature parity on the consolidated path: comments, collaborators, review status, quick actions, family preview, etc.
- Add tests for redirect behaviour and editor-shell rendering across at least one PYP, MYP, and DP route.
- Clean up navigation registry or route config entries that still reference transitional paths.

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

- Frontend redirects or link updates to canonical IB routes.
- Consolidated editor-shell usage in IB workspaces.
- Tests around canonical IB navigation and rendering.

## Acceptance criteria

- IB users no longer bounce between IB-native and generic planning shells unnecessarily.
- Canonical routes render the expected editor experience across programmes.
- Redirects preserve context and do not strand users on broken paths.
- The codebase has fewer duplicate shell implementations.

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

- Do not remove generic editors that other curricula still need.
- Avoid introducing redirect loops or stale route helpers.
- Keep shared editor primitives pack-neutral even when wrapped by IB shells.
