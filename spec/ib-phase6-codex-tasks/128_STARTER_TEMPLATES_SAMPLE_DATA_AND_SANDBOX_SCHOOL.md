# Task 128 — Starter templates, sample data, and sandbox school

## Major step context

This task belongs to **Step 6 — Make implementation support a real product surface**.

### Step goal
Reduce training burden through in-product guidance, templates, checklists, and sandboxed starter content.

### Why this step exists now
A system can have strong features and still fail adoption if the first-run experience is confusing or too documentation-heavy.

## Objective

Provide safe starter content and a sandbox mode that help schools understand the product before they commit live data.

## Dependency position

- 127

## Primary repo areas to inspect and modify

- `/apps/core/db/seeds`
- `/apps/core/app/services/ib`
- `/apps/web/src/features/ib`
- `/packages/contracts/curriculum-profiles`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Define the starter objects that are most useful for first-run experience: sample PYP unit, sample MYP unit, sample DP course map, sample evidence/story, sample standards packet, sample pilot setup state.
- Create seed or generator logic that can populate a sandbox school or demo tenant without polluting real pilot data.
- Ensure sample content is clearly marked as sample/demo and can be reset or destroyed safely.
- Where templates are provided for live use, distinguish between copyable templates and read-only examples.
- Expose sandbox/sample access through the UI for admins/coordinators in a way that does not confuse live and demo spaces.
- Document how sample data interacts with pack versions and release gates.

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

- Starter templates and/or sandbox seed flows.
- UI affordances for accessing/copying sample content safely.
- Documentation for resetting or separating sandbox content.

## Acceptance criteria

- A school can explore representative IB workflows without first importing all its real data.
- Sample/demo content is clearly marked and non-destructive.
- Copyable templates reduce blank-page friction without contaminating live records.
- Sandbox data obeys the same active IB pack assumptions as pilot tenants.

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

- Do not let demo content accidentally appear in guardian-facing or live reporting surfaces.
- Avoid maintaining two completely separate UI systems for demo versus live.
- Keep seed data realistic enough to teach, not cartoonishly simplified.
