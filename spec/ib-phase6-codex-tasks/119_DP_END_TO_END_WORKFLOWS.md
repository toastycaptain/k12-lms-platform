# Task 119 — DP end-to-end workflows

## Major step context

This task belongs to **Step 4 — Add true end-to-end IB workflow testing**.

### Step goal
Exercise real programme workflows across the web app and API so pilot readiness is verified by behavioural tests, not just isolated component/spec coverage.

### Why this step exists now
The product now contains enough moving pieces that regressions will show up in cross-surface flows long before they show up in unit tests.

## Objective

Exercise the most operationally sensitive DP flows—course maps, IA checkpoints, TOK/EE/CAS records, and coordinator risk views—through end-to-end tests.

## Dependency position

- 118

## Primary repo areas to inspect and modify

- `/apps/web/src/app/ib/dp`
- `/apps/web/src/features/ib/dp`
- `/apps/core/app/controllers/api/v1/ib`
- `/apps/core/app/models/ib_operational_record.rb`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Write DP flows for a teacher/advisor opening a course map or operational record, updating checkpoint data, and seeing the status reflected in related DP views.
- Cover at least one IA path and one core component path (CAS, EE, or TOK) end to end, including review/comment or risk-state propagation.
- Include coordinator/admin views that aggregate DP risk or incomplete milestone state and assert that underlying changes are reflected there.
- Where student/guardian surfaces expose DP support information, add a slim read-only verification path.
- Exercise failure or validation states, especially around missing owners, blocked transitions, or incomplete checkpoint data.

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

- DP Playwright tests tied to the live DP slice.
- Fixtures representing realistic DP records and ownership roles.

## Acceptance criteria

- At least one complete DP teacher/advisor workflow and one coordinator oversight path are covered end to end.
- Operational risk propagation is tested rather than inferred.
- The tests prove the DP slice is wired to backend state transitions.
- Failure handling in DP paths is visible in CI.

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

- Do not try to encode the entire diploma workflow universe into one phase of tests.
- Focus on the product's implemented DP operations, not hypothetical future ones.
- Keep role boundaries explicit in the test data and assertions.
