# Task 139 — Mobile QA, accessibility, and performance budgets

## Major step context

This task belongs to **Step 8 — Expand mobile and quick-action parity**.

### Step goal
Make the two-minute teacher/coordinator/specialist actions excellent on mobile and small screens without over-promising full desktop parity.

### Why this step exists now
Real school adoption depends on handling triage, approvals, evidence, and publishing from phones or tablets in the hallway or between classes.

## Objective

Define and enforce quality bars for mobile/responsive IB experiences so quick-action parity does not regress once shipped.

## Dependency position

- 138

## Primary repo areas to inspect and modify

- `/apps/web/playwright.config.ts`
- `/apps/web/src/features/ib`
- `/apps/web/src/features/ib/mobile`
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
- Create a mobile QA matrix covering devices/viewports, roles, critical actions, network conditions, and accessibility checks for the priority surfaces.
- Set practical performance budgets for mobile route loads and interaction responsiveness on teacher console, evidence inbox, publishing queue, and review triage.
- Add viewport-based automated checks where feasible, plus a manual QA checklist for gestures, keyboard focus, screen readers, and low-connectivity scenarios.
- Integrate mobile QA expectations into release gates and pilot readiness where appropriate.
- Document known desktop-only exceptions and acceptable degradations so QA remains honest.

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

- A mobile QA matrix and performance budget document.
- Automated/mobile-specific checks where practical.
- Release-gate hooks or checklist additions.

## Acceptance criteria

- There is a clear quality bar for mobile quick-action experiences.
- Key responsive surfaces are tested or manually verifiable in a repeatable way.
- Performance regressions on critical mobile routes are detectable.
- Accessibility concerns are part of mobile QA, not an afterthought.

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

- Do not pretend full native-app quality is in scope; keep budgets realistic for the web app.
- Avoid a QA matrix so large it will never be run.
- Document intentional limitations clearly.
