# Task 10 — IB STEP2 PACK WORKFLOWS FRAMEWORK BINDINGS AND MIGRATIONS

## Position in sequence
- **Step:** 2 — Make the IB pack much richer
- **Run after:** Task 09
- **Run before:** Task 11 now uses these pack/workflow foundations to build the teacher operations layer.
- **Primary mode:** Backend + Frontend

## Objective
Finalize the expanded IB pack by adding workflow definitions, binding every document type to the correct workflow, completing framework bindings, and defining migration/compatibility rules from the old starter pack.

## Why this task exists now
After Tasks 06–09, the pack has the necessary domain breadth. This task makes it usable and safe by wiring workflows, readiness, frameworks, and migration paths coherently.

## Current repo anchors
- Output from Tasks 06–09
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor
- `apps/core/app/services/curriculum/workflow_engine.rb`
- `apps/core/app/services/curriculum/pack_schema_resolver.rb`
- `apps/core/app/models/curriculum_profile_release.rb`
- `apps/web/src/curriculum/workflow/WorkflowActions.tsx`

## Scope
- Define workflow definitions for each IB document family with named states, events, guards, and side effects.
- Bind every new document type to a workflow.
- Complete framework bindings and report bindings so later analytics/tasks can query frameworks consistently.
- Define a starter migration strategy from existing IB-related documents or starter schemas to the new pack version.

## Backend work
- Implement or extend pack-aware workflow support so the new workflow definitions are valid and executable.
- Add migration helpers or compatibility aliases where older `schema_key` values must still resolve temporarily.
- Update any runtime pack-release logic if a new pack key/version is introduced.

## Frontend work
- Confirm the frontend can render available workflow events, readiness blockers, and framework metadata using the expanded pack without code changes beyond typing adjustments.
- Do not yet redesign workflow UI deeply; that occurs in later operational tasks.

## Data contracts, APIs, and model rules
- Define which states are shared across families (`draft`, `in_review`, `published`, `archived`) and which are domain-specific (`ready_for_digest`, `advisor_review`, `coordinator_review`, `exhibition_ready`, etc.).
- Document side effects explicitly—approval creation, auto-approval, publish queue creation, digest scheduling eligibility, or risk recalculation—as metadata and backend logic, not just comments.
- Define compatibility mapping from starter types like `unit_plan` + schema keys to target IB types if temporary bridging is required.

## Risks and guardrails
- Do not create workflow states that the UI cannot clearly explain.
- Do not leave any new document type without a bound workflow or readiness semantics.

## Testing and verification
- Workflow-engine tests for new workflow definitions.
- Pack validation tests covering workflow bindings, framework bindings, and compatibility aliases.
- End-to-end smoke tests that create representative PYP, MYP, and DP docs and transition them through a minimal happy path.

## Feature flags / rollout controls
- Use `ib_pack_v2` and, if needed, `ib_pack_v2_workflows` for staged rollout.
- Do not auto-migrate all old documents on deploy; leave bulk migration for Step 8.

## Acceptance criteria
- The IB pack is now structurally complete enough for the rest of this phase.
- Every later task can rely on named document types, workflows, frameworks, and migration rules instead of inventing them.

## Handoff to the next task
- Task 11 now uses these pack/workflow foundations to build the teacher operations layer.
