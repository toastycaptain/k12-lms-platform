# Task 101 — CI baseline and test failure triage

## Major step context

This task belongs to **Step 1 — Lock down build integrity and release discipline**.

### Step goal
Turn the current IB implementation into a reproducible pilot baseline with clean source integrity, stable CI, frozen runtime contracts, and explicit rollback/release controls.

### Why this step exists now
The product now has broad IB coverage. The main risk is no longer missing features; it is shipping or iterating on top of an unstable build, partial export, or inconsistent pack/runtime state.

## Objective

Establish a truthful green-or-red baseline across web, core, AI gateway, and IB e2e layers, then remove flaky or hidden failures before declaring a pilot candidate.

## Dependency position

- 100

## Primary repo areas to inspect and modify

- `/apps/core/spec`
- `/apps/web`
- `/apps/ai-gateway/tests`
- `/.github/workflows`
- `/apps/web/playwright.config.ts`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Inventory all existing CI scripts and local verification commands for Rails, Next.js, Playwright, Vitest, and AI gateway tests; normalise them into a single documented verification matrix.
- Run or emulate the full matrix and capture failing tests, flaky tests, slow tests, missing environment variables, and suites that silently skip critical IB behaviour.
- Split failures into categories: deterministic code bugs, fixture/data issues, environment issues, test brittleness, and obsolete assertions from pre-pilot phases.
- Prioritise fixes that block trust in the release baseline: route resolution, pack loading, publishing jobs, IB route page renders, and end-to-end smoke flow setup.
- Add or update CI jobs so the matrix explicitly includes the active IB web build, API tests, and at least a pilot smoke Playwright shard.
- Mark any temporarily excluded tests with expiration comments, issue references, and explicit reasons; avoid silent `skip` usage with no plan.
- Document known slow suites and identify quick wins like shared factories, better seed fixtures, or request-spec consolidation.

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

- A CI baseline document or checked-in script matrix.
- Fixed failing tests or clearly annotated temporary quarantines.
- Updated workflow configuration to run the critical IB pilot baseline checks.
- A triage summary explaining any remaining risk.

## Acceptance criteria

- The documented baseline commands run cleanly or fail only on explicitly quarantined items with reasons.
- CI includes build/typecheck/lint/test coverage for both `apps/core` and `apps/web`, plus a minimal IB e2e smoke path.
- No unexplained red build remains in the baseline branch.
- A new contributor can tell exactly which commands define 'pilot baseline green'.

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

- Do not water down assertions simply to make the dashboard green.
- Avoid introducing brittle test sleeps; prefer deterministic waiting and fixture setup.
- Keep the baseline honest even if that means carrying a short quarantine list.
