# Task 135 — Mobile priority matrix and responsive baseline

## Major step context

This task belongs to **Step 8 — Expand mobile and quick-action parity**.

### Step goal
Make the two-minute teacher/coordinator/specialist actions excellent on mobile and small screens without over-promising full desktop parity.

### Why this step exists now
Real school adoption depends on handling triage, approvals, evidence, and publishing from phones or tablets in the hallway or between classes.

## Objective

Define exactly which IB tasks must work well on mobile/tablet and establish a responsive baseline across those surfaces.

## Dependency position

- 134

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib/mobile`
- `/apps/web/src/features/ib`
- `/apps/web/src/app/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Inventory mobile-relevant IB actions across teacher, specialist, coordinator, advisor, and admin roles; separate must-have quick actions from desktop-only power workflows.
- Create a priority matrix ranking actions by frequency, urgency, context of use (hallway, classroom, commute), and dependency on rich screen real estate.
- Audit current responsive behaviour on the existing IB surfaces and identify layout breaks, hidden actions, excessive scrolling, and unreadable controls.
- Define a mobile baseline for navigation, status visibility, drafts/autosave indicators, and route transitions across the priority surfaces.
- Document which experiences are intentionally desktop-first so expectations remain honest.
- Add this matrix/baseline to the phase documentation so subsequent mobile tasks have a clear target.

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

- A mobile priority matrix for IB roles/tasks.
- A responsive baseline spec for priority surfaces.
- An explicit list of desktop-first experiences.

## Acceptance criteria

- The team knows which actions must be excellent on mobile versus merely accessible.
- Responsive gaps on critical surfaces are identified and prioritised.
- Users are not misled into thinking every studio is fully mobile-optimised.
- Subsequent mobile work is guided by a documented baseline, not guesswork.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Prioritise high-frequency, low-duration tasks first.
- Do not force full planning studios into cramped layouts prematurely.
- Offline/retry behaviour must be explicit and trustworthy.

## Task-specific guardrails / non-goals

- Do not attempt to optimise every IB surface for phones at once.
- Avoid treating mobile as a simple CSS shrink-down problem.
- Keep user role context central to prioritisation.
