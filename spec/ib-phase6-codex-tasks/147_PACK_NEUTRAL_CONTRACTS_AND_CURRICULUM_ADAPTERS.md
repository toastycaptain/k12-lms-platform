# Task 147 — Pack-neutral contracts and curriculum adapters

## Major step context

This task belongs to **Step 10 — Shift to cross-curriculum extraction after pilot hardening**.

### Step goal
Identify and extract the platform primitives proven by IB so the next American/British maturity phases reuse strong shared modules instead of copying IB code.

### Why this step exists now
IB has been the hardest proving ground; the right next move is to harvest shared modules, not trap them inside IB-only implementations.

## Objective

Formalise the contracts and adapter seams that let shared modules behave differently for IB, American, and British packs without hardcoded branching.

## Dependency position

- 146

## Primary repo areas to inspect and modify

- `/packages/contracts`
- `/apps/core/app/services/curriculum`
- `/apps/web/src/features/curriculum`
- `/apps/web/src/features/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Review where shared modules still branch directly on IB assumptions rather than consulting curriculum pack metadata or an adapter contract.
- Define or refine interfaces for pack-specific labels, statuses, review rules, evidence publishing semantics, and readiness criteria where these should vary by curriculum.
- Update shared modules to depend on these contracts/adapters instead of hardcoded IB-specific conditionals.
- Document example IB adapter implementations and placeholders for other curricula without fully implementing those curricula now.
- Add tests to prove the shared layer remains pack-neutral while IB behaviour is preserved through adapters.

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

- Pack-neutral contract definitions or adapter interfaces.
- Refactored shared modules using those contracts.
- Tests and docs demonstrating IB implementation via adapters.

## Acceptance criteria

- Shared modules no longer require direct IB checks where pack/adapter consultation is the right abstraction.
- IB still behaves as before through explicit adapter/config layers.
- The codebase is better prepared for American/British adoption work.
- Contracts are concrete enough to implement, not hand-wavy placeholders.

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

- Do not prematurely design every possible curriculum variation; model the variations already proven by IB and anticipated by the pack system.
- Avoid creating a maze of tiny interfaces where a few strong contracts would suffice.
- Keep adapter responsibilities sharply defined.
