# Task 08 — IB STEP2 MYP PACK DOCUMENT TYPES AND SCHEMAS

## Position in sequence
- **Step:** 2 — Make the IB pack much richer
- **Run after:** Task 07
- **Run before:** Task 09 completes pack richness for DP and core work.
- **Primary mode:** Backend + Frontend

## Objective
Add full MYP pack support: document types, data schemas, UI schemas, relationships, frameworks, and workflows for unit planning, interdisciplinary planning, criteria, ATL, projects, and service-related records.

## Why this task exists now
The current MYP frontend already signals concepts, contexts, criteria, ATL, interdisciplinary planning, and projects. The pack must now be able to express those objects in a first-class way rather than pretending they are generic unit notes.

## Current repo anchors
- Output from Tasks 06–07
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor pack file
- `apps/web/src/features/ib/myp/*`
- `apps/core/app/services/curriculum/*`

## Scope
- Define MYP document types such as `ib_myp_unit`, `ib_myp_interdisciplinary_unit`, `ib_myp_project`, `ib_myp_service_reflection`, and any supporting records needed for project checkpoints or advisor review.
- Create full schemas for statement of inquiry, global context, key/related concepts, inquiry questions, ATL focus, criteria planning, summative tasks, interdisciplinary links, project milestones, and service reflections.
- Define relationships between subject units, interdisciplinary units, project records, and service-related evidence.

## Backend work
- Ensure the pack schema can express criterion matrices, ATL clusters, global-context selections, and inquiry-question sets cleanly.
- Add test fixtures for valid and invalid MYP documents.
- Verify that relationship and workflow bindings do not collide with PYP or DP types.

## Frontend work
- Update frontend pack typing support for any new widget types needed by MYP documents (e.g. criteria matrix widgets, concept/context chips, interdisciplinary linkage selectors).

## Data contracts, APIs, and model rules
- Add framework bindings for global contexts, key concepts, related concepts, ATL categories/clusters, and MYP criteria references by subject group where applicable.
- Define workflow variants if MYP interdisciplinary units or project reviews require different approval stages from ordinary subject units.
- Capture readiness metadata that can later drive risk dashboards and “incomplete planning” warnings.

## Risks and guardrails
- Do not model every MYP project/service artifact as a freeform note if later risk and completion tracking depend on structured fields.
- Do not hardcode subject-group-specific criteria tables in the frontend only; the pack should still describe them sufficiently.

## Testing and verification
- Pack validation tests for all new MYP schemas.
- Document factory creation tests for MYP unit and interdisciplinary/project document types.
- Regression test that the older starter MYP unit schema still resolves only if intentionally retained as a compatibility alias.

## Feature flags / rollout controls
- Keep exposure behind `ib_pack_v2` until the front-end cutover is ready.
- Do not build MYP vertical slices in this pack beyond the foundational operational work required in Steps 1–8.

## Acceptance criteria
- The pack can now describe real MYP planning and project/service records.
- The MYP UI no longer depends on assumptions that the pack cannot express.

## Handoff to the next task
- Task 09 completes pack richness for DP and core work.
