# Task 120 — Coordinator, guardian, and failure-path end-to-end coverage

## Major step context

This task belongs to **Step 4 — Add true end-to-end IB workflow testing**.

### Step goal
Exercise real programme workflows across the web app and API so pilot readiness is verified by behavioural tests, not just isolated component/spec coverage.

### Why this step exists now
The product now contains enough moving pieces that regressions will show up in cross-surface flows long before they show up in unit tests.

## Objective

Round out the pilot suite with cross-cutting coordinator/admin/guardian flows and explicit failure-path tests for exports, queues, readiness, and permissions.

## Dependency position

- 119

## Primary repo areas to inspect and modify

- `/apps/web/src/app/ib`
- `/apps/web/src/features/ib/admin`
- `/apps/web/src/features/ib/guardian`
- `/apps/core/app/controllers/api/v1/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Add e2e scenarios for pilot setup/readiness consoles, rollout state changes, standards packet inspection/export initiation, and operational queue triage.
- Cover guardian calm-mode consumption of stories/progress/current-unit windows across at least one programme with correct visibility scoping.
- Add permission tests that ensure unauthorised roles cannot reach admin or coordinator mutation paths even if they know route URLs.
- Test representative failure paths: failed export surfaced in UI, blocked readiness rule, failed publishing queue item with retry visibility, and missing route/record redirect handling.
- Ensure the suite leaves behind human-readable evidence of failure state (screenshots, exported conflict text, queue status messages).

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

- Cross-cutting e2e tests for coordinator/admin/guardian/failure scenarios.
- Permission and failure-path fixtures/assertions.

## Acceptance criteria

- The pilot suite now covers both operational oversight and end-user consumption paths.
- Critical failure states are tested intentionally, not just by accident.
- Permissions for sensitive IB routes and actions are validated in-browser.
- Guardian/family surfaces are verified against real publication visibility.

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

- Do not attempt exhaustive permission coverage in one task; focus on high-risk surfaces.
- Keep guardian scenarios calm and realistic rather than admin-like.
- Avoid flaky failure tests that depend on timing chaos; inject deterministic failures where needed.
