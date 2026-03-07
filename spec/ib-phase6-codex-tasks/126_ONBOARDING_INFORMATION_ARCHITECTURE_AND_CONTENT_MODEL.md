# Task 126 — Onboarding information architecture and content model

## Major step context

This task belongs to **Step 6 — Make implementation support a real product surface**.

### Step goal
Reduce training burden through in-product guidance, templates, checklists, and sandboxed starter content.

### Why this step exists now
A system can have strong features and still fail adoption if the first-run experience is confusing or too documentation-heavy.

## Objective

Design the information architecture for in-product implementation support so guidance, checklists, templates, and help content are consistent and reusable.

## Dependency position

- 125

## Primary repo areas to inspect and modify

- `/apps/web/src/features/ib`
- `/apps/core/app/models`
- `/docs`
- `/packages/contracts`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Audit current empty states, helper copy, QA markdowns, and support notes to identify duplicated or inconsistent onboarding guidance.
- Define content types for implementation support: checklist item, help article, tooltip/help hint, empty-state action card, starter template, sample object, and walkthrough step.
- Choose where this content lives (static code, structured JSON, database-backed CMS-lite model, or hybrid) based on how often it needs editing and reuse across curricula.
- Map the most important surfaces that need support content: pilot setup, planning studios, evidence inbox, publishing queue, standards packets, specialist dashboard, mobile triage.
- Establish tone/style rules: concise, action-oriented, school-operator friendly, not product-marketing fluff.
- Plan localisation or multi-language support if guardian/admin-facing help copy may need it later.

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

- A support-content IA/model decision.
- A map of where in-product guidance is needed most.
- Style and reuse guidelines for support content.

## Acceptance criteria

- Implementation support content has a clear structure and storage strategy.
- The team knows where to add future guidance without scattering hardcoded strings.
- High-value support surfaces are identified and prioritised.
- The model is flexible enough for future American/British reuse.

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

- Do not overbuild a full CMS if static/configured content is sufficient for now.
- Avoid burying actionable guidance inside long generic help articles.
- Keep support architecture decoupled from IB-only terminology where shared reuse is intended.
