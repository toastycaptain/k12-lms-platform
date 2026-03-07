# Task 106 — Pilot setup backend APIs and validations

## Major step context

This task belongs to **Step 2 — Move into real pilot-school enablement**.

### Step goal
Convert pilot activation from an engineer-only set of commands into a governed product workflow for admins, coordinators, and support staff.

### Why this step exists now
A school should be able to stand up the IB experience through controlled setup flows, not ad hoc environment tweaks or manual data manipulation.

## Objective

Expose the setup domain through safe, validated backend APIs that can drive a guided pilot setup wizard and live readiness console.

## Dependency position

- 105

## Primary repo areas to inspect and modify

- `/apps/core/app/controllers/api/v1/ib`
- `/apps/core/app/services/ib/support`
- `/apps/core/app/policies`
- `/apps/core/config/routes.rb`
- `/apps/core/spec/requests/api`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Add or extend endpoints for reading setup state, mutating setup steps, previewing impacts, and validating prerequisites without requiring direct database access.
- Ensure request/response contracts separate mutable configuration from computed status; do not let the frontend fabricate readiness by writing derived values.
- Implement validation rules for pack selection, academic year presence, feature-flag bundle completeness, role assignments, guardian visibility defaults, and queue/job preconditions.
- Scope setup APIs properly by district/tenant/school and ensure only authorised admin/coordinator roles can use mutations.
- Return structured blockers, warnings, and next actions so the frontend can present precise operator guidance.
- Add request specs that cover success cases, forbidden access, partial setup, invalid state transitions, and multi-school contexts.

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

- Stable pilot setup/readiness API endpoints.
- Structured validation responses with blockers/warnings/actions.
- Request specs proving permission and multi-school behaviour.

## Acceptance criteria

- The frontend can build a complete setup flow using backend responses rather than hidden assumptions.
- Setup APIs never accept invalid or contradictory configuration silently.
- Permission checks prevent teachers or unauthorised users from changing rollout state.
- Request specs cover both happy path and blocker path scenarios.

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

- Do not overload existing generic admin endpoints with opaque IB-only semantics if a dedicated IB API is clearer.
- Keep error payloads human-readable enough for admin UX.
- Avoid write endpoints that mutate multiple unrelated domains with no transaction or rollback story.
