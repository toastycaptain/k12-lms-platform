# Task 149 — Post-Phase 6 platformization and next-phase signal

## Major step context

This task belongs to **Step 10 — Shift to cross-curriculum extraction after pilot hardening**.

### Step goal
Identify and extract the platform primitives proven by IB so the next American/British maturity phases reuse strong shared modules instead of copying IB code.

### Why this step exists now
IB has been the hardest proving ground; the right next move is to harvest shared modules, not trap them inside IB-only implementations.

## Objective

Close Phase 6 by documenting what was accomplished, what remains for live pilot feedback, and how the next American/British maturity phases should begin from the extracted platform base.

## Dependency position

- 148

## Primary repo areas to inspect and modify

- `/docs`
- `/tasks`
- `/packages/contracts`
- `/apps/web/src/features/ib/qa`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Write a concise but comprehensive post-Phase 6 summary covering pilot readiness, import/migration capabilities, e2e coverage, operations hardening, mobile parity, and document consolidation.
- List the remaining pilot-era concerns that should be driven by live feedback rather than speculative coding: adoption friction, support load, performance outliers, and data migration edge cases.
- Signal the future phase order explicitly: live pilot feedback loop, then American/British maturity work built on extracted shared primitives.
- Include recommendations for how future Codex packs should consume the shared module inventory, QA matrix, and adapter contracts.
- Reference the final coverage matrix and orchestration guidance so the closeout is actionable.

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

- A post-Phase 6 closeout document embedded in the task pack.
- Clear signal of subsequent phases without prematurely expanding scope.

## Acceptance criteria

- Anyone reading the phase outputs understands what Phase 6 accomplished and what comes next.
- The next phase entry points are explicit and grounded in completed work.
- The closeout does not blur pilot hardening with future curriculum feature waves.
- The product direction after Phase 6 is documented, not implied.

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

- Do not hide unresolved risk behind a celebratory summary.
- Keep the next-phase signal specific enough to be useful but scoped enough to avoid phase creep now.
- Tie recommendations back to actual extracted/shared work.
