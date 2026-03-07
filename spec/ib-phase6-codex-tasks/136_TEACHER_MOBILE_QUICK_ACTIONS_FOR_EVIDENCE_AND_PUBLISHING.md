# Task 136 — Teacher mobile quick actions for evidence and publishing

## Major step context

This task belongs to **Step 8 — Expand mobile and quick-action parity**.

### Step goal
Make the two-minute teacher/coordinator/specialist actions excellent on mobile and small screens without over-promising full desktop parity.

### Why this step exists now
Real school adoption depends on handling triage, approvals, evidence, and publishing from phones or tablets in the hallway or between classes.

## Objective

Make the most common teacher mobile tasks—evidence triage, reflection requests, family publishing decisions—fast, reliable, and easy to complete in two minutes.

## Dependency position

- 135

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib/evidence`
- `/apps/web/src/features/ib/families`
- `/apps/web/src/features/ib/mobile`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Optimise evidence inbox and review drawers for small screens: visible key metadata, swipe or stacked actions where appropriate, and reduced form overhead.
- Support quick reflection requests, visibility assignment, story attach, hold/publish decisions, and note/comment responses without requiring the full desktop layout.
- Make state changes obvious with resilient toasts/status pills, not subtle visual changes that disappear on mobile.
- Handle temporary connectivity loss or backgrounding gracefully by preserving drafts/queued actions where possible.
- Add mobile-specific tests or viewport coverage for the critical teacher quick actions.
- Measure quick-action completion in analytics to validate whether the redesign helps.

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

- Improved mobile UI for teacher evidence/publishing quick actions.
- Viewport tests or QA coverage for those actions.
- Analytics hooks for mobile quick-action usage.

## Acceptance criteria

- A teacher can triage evidence and make publishing-related decisions on a phone without feeling forced back to desktop.
- Critical mobile actions have clear success/failure feedback.
- Quick actions remain permission-safe and tied to live backend mutations.
- The UI reduces taps and scrolling compared with desktop-derived layouts.

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

- Do not cram full story composition or heavy authoring into mobile just because it is technically possible.
- Avoid hidden destructive actions with no confirmation on small screens.
- Keep accessibility and thumb-reach considerations visible in design choices.
