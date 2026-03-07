# Task 117 — PYP end-to-end workflows

## Major step context

This task belongs to **Step 4 — Add true end-to-end IB workflow testing**.

### Step goal
Exercise real programme workflows across the web app and API so pilot readiness is verified by behavioural tests, not just isolated component/spec coverage.

### Why this step exists now
The product now contains enough moving pieces that regressions will show up in cross-surface flows long before they show up in unit tests.

## Objective

Cover the highest-value PYP behaviours end to end so teacher, coordinator, and family flows are protected against regression.

## Dependency position

- 116

## Primary repo areas to inspect and modify

- `/apps/web/src/app/ib/pyp`
- `/apps/web/src/features/ib/pyp`
- `/apps/core/app/controllers/api/v1/ib`
- `/apps/core/app/services/ib/pyp`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Write PYP e2e scenarios for core teacher actions: open unit, edit key fields, save, attach evidence, request reflection, draft a family story, and queue/publish it.
- Add coordinator scenarios around POI review, specialist contribution visibility, approval flow, and exception surfacing.
- Cover at least one family-facing path that consumes a published PYP story or current-unit window and verifies calm-mode visibility expectations.
- Include negative/blocked paths such as missing required fields, blocked publish due to visibility rules, or readiness blockers preventing progression.
- Prefer realistic cross-page flows rather than isolated route smoke; the point is to validate the operational slice as a user experiences it.

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

- PYP Playwright tests covering teacher, coordinator, and family flows.
- Any fixture or helper additions required for PYP route coverage.

## Acceptance criteria

- The PYP slice can be exercised end to end with stable assertions.
- Both happy-path and blocked-path behaviour are represented.
- Tests verify that the live route tree and backend state changes align.
- A regression in evidence/story/publish flow is caught by e2e rather than by user report.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Optimise for stable, deterministic end-to-end suites that validate the highest-value workflows.
- Use seeded or factory-driven data that mirrors the active IB pack and route tree.
- Make failures easy to diagnose with artifacts, traces, and human-readable step names.

## Task-specific guardrails / non-goals

- Do not assert implementation details that make the tests fragile to harmless UI tweaks.
- Keep PYP tests focused on real workflow milestones, not every widget.
- Reuse shared helpers where appropriate but keep scenario intent readable.
