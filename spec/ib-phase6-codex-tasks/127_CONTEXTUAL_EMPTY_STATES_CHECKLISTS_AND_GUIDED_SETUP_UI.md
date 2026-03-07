# Task 127 — Contextual empty states, checklists, and guided setup UI

## Major step context

This task belongs to **Step 6 — Make implementation support a real product surface**.

### Step goal
Reduce training burden through in-product guidance, templates, checklists, and sandboxed starter content.

### Why this step exists now
A system can have strong features and still fail adoption if the first-run experience is confusing or too documentation-heavy.

## Objective

Turn high-friction empty or partially-configured pages into guided experiences that tell users what to do next and why it matters.

## Dependency position

- 126

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib`
- `/apps/web/src/app/ib`
- `/apps/web/src/features/ib/admin`
- `/apps/web/src/features/ib/shared`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Identify pages that still go blank, show generic 'no data', or expose advanced UI before setup is complete.
- Design contextual empty states that differentiate between first-run, missing permission, missing prerequisite, and genuinely empty-but-ready conditions.
- Embed next actions, related docs/help links, and one-click navigation into setup or creation flows directly from those empty states.
- Add lightweight guided checklists on key surfaces such as Evidence Inbox, Publishing Queue, Standards Packet detail, and Programme Operations Center.
- Ensure checklist completion is tied to real data when possible, not manually dismissible fluff only.
- Add frontend tests for key empty-state variants so future work does not regress them to generic placeholders.

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

- Upgraded empty states and embedded checklists across the highest-friction IB surfaces.
- Tests validating important conditional UI states.

## Acceptance criteria

- A new pilot user is guided toward productive action from empty or blocked screens.
- Empty states explain whether the issue is setup, permission, or genuine absence of data.
- Checklists feel connected to real completion state where practical.
- The product no longer strands users on blank or overly technical screens.

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

- Do not add noisy checklists to every page; focus on the highest-value operational surfaces.
- Avoid patronising UX copy or duplicate instructions across nested layouts.
- Keep the UI calm—guidance should reduce noise, not add it.
