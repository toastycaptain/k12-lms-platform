# Task 109 — Rollout playbook, support tooling, and admin runbooks

## Major step context

This task belongs to **Step 2 — Move into real pilot-school enablement**.

### Step goal
Convert pilot activation from an engineer-only set of commands into a governed product workflow for admins, coordinators, and support staff.

### Why this step exists now
A school should be able to stand up the IB experience through controlled setup flows, not ad hoc environment tweaks or manual data manipulation.

## Objective

Package pilot enablement into operator-grade runbooks and support tools so the platform can be rolled out predictably by admins, coordinators, and internal support staff.

## Dependency position

- 108

## Primary repo areas to inspect and modify

- `/docs`
- `/tasks`
- `/apps/web/src/features/ib/admin`
- `/apps/core/app/services/ib/governance`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Write or update runbooks for common rollout scenarios: single-school pilot, district-first pilot, staged programme activation, pause/resume pilot, and pilot rollback.
- Provide support-oriented surfaces or filters that show which schools are in setup, blocked, active, paused, or drifting from baseline.
- Add quick links from support views into setup wizard steps, readiness blockers, pack status, and feature flags.
- Document ownership boundaries between product support, engineering, school admin, and programme coordinators so operational tasks are not ambiguous.
- Where feasible, add support actions that are safe to expose (recompute readiness, resend setup invite, rerun export, reopen blocked checklist item) without shell access.
- Include a final 'pilot launch day' runbook with pre-flight, go-live, and post-launch verification steps.

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

- Support and rollout documentation tied to live product surfaces.
- Any lightweight support tooling needed in the app.
- A launch-day runbook/checklist.

## Acceptance criteria

- Support staff can understand and assist pilot rollout without engineering custom scripts.
- Runbooks reference current product surfaces and terminology.
- There is a clear documented flow for launch-day verification and pause/resume decisions.
- School operators are not forced to infer next steps from generic admin pages.

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

- Do not create support docs divorced from actual UI labels or route names.
- Avoid hidden privileged actions with no audit trail.
- Treat runbooks as living product documentation, not disposable notes.
