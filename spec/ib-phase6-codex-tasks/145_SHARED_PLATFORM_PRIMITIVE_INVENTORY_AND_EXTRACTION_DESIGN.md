# Task 145 — Shared platform primitive inventory and extraction design

## Major step context

This task belongs to **Step 10 — Shift to cross-curriculum extraction after pilot hardening**.

### Step goal
Identify and extract the platform primitives proven by IB so the next American/British maturity phases reuse strong shared modules instead of copying IB code.

### Why this step exists now
IB has been the hardest proving ground; the right next move is to harvest shared modules, not trap them inside IB-only implementations.

## Objective

Catalogue which strong modules emerged from the IB buildout and design how to extract them into pack-neutral platform primitives without starting the next curriculum wave yet.

## Dependency position

- 144

## Primary repo areas to inspect and modify

- `/apps/core/app/services/ib`
- `/apps/web/src/features/ib`
- `/packages/contracts`
- `/docs`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Identify the modules IB has proven valuable that should become cross-curriculum primitives: pilot setup, readiness, evidence publishing, standards packet/evaluation patterns, review governance, support tooling, analytics, and mobile quick actions.
- For each candidate, separate shared capability from IB-specific expression (for example, publishing queue engine versus IB family-story semantics).
- Assess code structure to see whether extraction should happen by moving shared code, introducing adapter interfaces, or formalising package boundaries/contracts.
- Document dependencies that would block extraction, such as IB terminology hardcoded in shared components or IB-specific database assumptions in supposedly generic services.
- Propose an extraction roadmap that can feed the future American/British maturity phases.

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

- A shared-primitive inventory with extraction candidates and blockers.
- A proposed extraction design/roadmap.

## Acceptance criteria

- The team can clearly distinguish platform primitive from IB-specific module.
- Extraction candidates are prioritised and justified.
- Known blockers to reuse are documented.
- The roadmap does not accidentally start a new curriculum implementation wave prematurely.

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

- Do not rewrite modules into generics in this task unless a small refactor is obviously safe and necessary.
- Avoid falsely declaring something shared if it still carries deep IB assumptions.
- Keep the design grounded in current code, not abstract architecture dreams.
