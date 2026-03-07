# Task 118 — MYP end-to-end workflows

## Major step context

This task belongs to **Step 4 — Add true end-to-end IB workflow testing**.

### Step goal
Exercise real programme workflows across the web app and API so pilot readiness is verified by behavioural tests, not just isolated component/spec coverage.

### Why this step exists now
The product now contains enough moving pieces that regressions will show up in cross-surface flows long before they show up in unit tests.

## Objective

Protect the MYP teacher/coordinator slice with full-stack behavioural tests that cover concept/context, criteria, interdisciplinary, and project/service pathways.

## Dependency position

- 117

## Primary repo areas to inspect and modify

- `/apps/web/src/app/ib/myp`
- `/apps/web/src/features/ib/myp`
- `/apps/core/app/controllers/api/v1/ib`
- `/apps/core/app/services/ib`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Add MYP e2e flows for unit editing with concepts, global context, statement of inquiry, criteria/ATL interactions, and save/publish state.
- Include interdisciplinary or project-oriented flows where the product now supports them, focusing on real route transitions and backend state changes.
- Cover coordinator review or operations views that surface MYP coverage imbalance, pending review, or milestone risk.
- Exercise at least one student-facing or guardian-facing outcome of MYP publishing/progress if those surfaces exist in the current pilot baseline.
- Include a blocked or return-with-comments path to ensure review governance works under test.

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

- MYP e2e scenarios integrated into the pilot baseline suite.
- Any additional fixtures required to represent MYP-specific data.

## Acceptance criteria

- Core MYP authoring and review flows are under end-to-end protection.
- Review or return-with-comments states are tested, not assumed.
- The suite validates that MYP routes are materially wired to live data, not static placeholders.
- MYP-specific regressions show up in CI artifacts clearly.

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

- Do not duplicate PYP assertions if the workflow intent differs; keep MYP semantics visible.
- Avoid overloading one giant test with too many unrelated MYP concerns.
- Use terminology and assertions that reflect real MYP workflow language.
