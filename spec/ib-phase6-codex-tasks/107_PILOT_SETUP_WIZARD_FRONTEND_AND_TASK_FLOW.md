# Task 107 — Pilot setup wizard frontend and task flow

## Major step context

This task belongs to **Step 2 — Move into real pilot-school enablement**.

### Step goal
Convert pilot activation from an engineer-only set of commands into a governed product workflow for admins, coordinators, and support staff.

### Why this step exists now
A school should be able to stand up the IB experience through controlled setup flows, not ad hoc environment tweaks or manual data manipulation.

## Objective

Create the actual pilot setup wizard experience that guides admins/coordinators through prerequisite completion with minimal confusion and clear recovery when blocked.

## Dependency position

- 106

## Primary repo areas to inspect and modify

- `/apps/web/src/app/ib/rollout`
- `/apps/web/src/features/ib/admin`
- `/apps/web/src/features/ib/layout`
- `/apps/web/src/lib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Design a step-based or checklist-driven wizard that mirrors the backend setup model rather than a generic form dump.
- Show progress, blockers, dependencies, unsaved changes, and previewable effects of each step (for example, enabling guardian visibility or applying a feature-flag bundle).
- Support safe resume behaviour so an operator can leave and return without losing partial progress or forgetting what remains.
- Make the wizard useful for both single-school and district/multi-school flows; where necessary, add school selectors and per-school status summaries.
- Link each step to contextual help, readiness explanations, and relevant governance surfaces instead of forcing users to guess where to fix issues.
- Add frontend tests around navigation, resume behaviour, blocker display, and submission flows.

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

- A production-ready pilot setup wizard in the IB admin area.
- Front-end tests validating the main setup states.
- Clear UX copy and status visuals that align to backend readiness terms.

## Acceptance criteria

- An admin can walk from empty setup to ready-for-validation without using developer tools or direct API calls.
- Blocked states are actionable, not generic error banners.
- Partial progress is preserved and resumable.
- The wizard uses live backend status and validations, not local-only assumptions.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Pilot setup must be reversible and non-destructive.
- Keep every readiness computation explainable to admins/coordinators.
- Do not hide blockers behind optimistic success screens.

## Task-specific guardrails / non-goals

- Do not make the wizard a one-time modal; it should become a persistent operational surface.
- Avoid overwhelming the user with all settings at once—progressive disclosure is required.
- Keep terminology aligned with the actual IB roles and school operators.
