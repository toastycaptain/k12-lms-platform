# Task 129 — Inline help, progressive disclosure, and training analytics

## Major step context

This task belongs to **Step 6 — Make implementation support a real product surface**.

### Step goal
Reduce training burden through in-product guidance, templates, checklists, and sandboxed starter content.

### Why this step exists now
A system can have strong features and still fail adoption if the first-run experience is confusing or too documentation-heavy.

## Objective

Deliver help where it is needed most and measure whether support content actually reduces friction instead of becoming another ignored layer.

## Dependency position

- 128

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib`
- `/apps/core/app/services/ib/support`
- `/apps/core/app/models`
- `/apps/web/src/features/ib/admin`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Add inline explainers, help drawers, or expandable contextual guidance to high-confusion surfaces such as review states, readiness blockers, publish states, and standards evidence strength.
- Use progressive disclosure: start with concise action guidance and allow deeper explanation on demand.
- Instrument help interactions (opened, completed, dismissed, followed recommended action) in a privacy-aware way so you can learn which guidance actually works.
- Differentiate permanent conceptual guidance from transient step-by-step support; do not overload one component with both.
- Feed key support usage metrics into admin/support dashboards to identify where pilots still struggle.
- Add tests for critical help triggers so they do not disappear during UI refactors.

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

- Contextual help components integrated into priority surfaces.
- Support-usage analytics events and dashboard hooks.
- Tests or storybook-like examples for key help states.

## Acceptance criteria

- Users can get concise help at the moment of confusion without leaving the flow.
- Help interactions are measurable enough to guide future UX work.
- The UI distinguishes quick guidance from deeper documentation cleanly.
- Training burden is reduced through product design, not shifted to PDFs alone.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Guidance should shorten the path to action, not create another layer of reading.
- Empty states must point to meaningful next actions.
- Support tooling should be modular so American/British packs can reuse the same primitives later.

## Task-specific guardrails / non-goals

- Do not turn every page into a tutorial overlay.
- Avoid analytics that capture sensitive educational content; measure interaction, not payload details.
- Help copy should support action, not restate field labels.
