# Task 09 — IB STEP2 DP PACK DOCUMENT TYPES AND SCHEMAS

## Position in sequence
- **Step:** 2 — Make the IB pack much richer
- **Run after:** Task 08
- **Run before:** Task 10 finalizes pack workflows, framework bindings, and migration rules across the full IB domain.
- **Primary mode:** Backend + Frontend

## Objective
Add full DP pack support: document types, schemas, frameworks, relationships, and workflows for course maps, internal assessments, TOK, extended essay, CAS experiences/projects/reflections, and coordinator/advisor review.

## Why this task exists now
The DP surfaces in the codebase currently present serious operational expectations, but the current pack cannot represent most of that state. DP credibility depends on structured objects, checkpoints, and risk-traceable workflows.

## Current repo anchors
- Output from Tasks 06–08
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor
- `apps/web/src/features/ib/dp/*`
- `apps/core/app/services/curriculum/*`

## Scope
- Define document types such as `ib_dp_course_map`, `ib_dp_internal_assessment`, `ib_dp_tok`, `ib_dp_extended_essay`, `ib_dp_cas_experience`, `ib_dp_cas_project`, `ib_dp_cas_reflection`, and any supporting checkpoint/review documents required by the product.
- Create schemas for course sequencing, IA checkpoints, authenticity notes, advisor/supervisor comments, TOK planning, EE milestones, CAS outcomes, CAS reflection quality, and completion states.
- Define relationships between course map → IA records → student/advisor checkpoints, and between DP core records where the UI expects cross-links.

## Backend work
- Ensure the pack can express timeline-like checkpoint groups, advisory notes, outcome selections, and completion risk hints.
- Add validation fixtures for valid/invalid DP documents.
- Keep workflow/state names consistent with the governance decisions from Task 06.

## Frontend work
- Update frontend pack typing/helpers for any DP-specific widget constructs needed later (timeline checkpoints, milestone matrices, advisor review notes, etc.).

## Data contracts, APIs, and model rules
- Add framework bindings for DP subject pathways, IA components if modeled as frameworks, CAS outcomes, TOK areas or prompt categories if appropriate, and DP core categories.
- Define workflow bindings for IA review, EE supervision, TOK checkpointing, and CAS advisor review so the UI can expose real states later.
- Include metadata for risk scoring inputs (e.g. due dates, missing supervisor notes, incomplete reflections, missing outcome coverage).

## Risks and guardrails
- Do not reduce DP core work to generic notes; completion/risk tracking later will depend on structured fields and explicit workflow states.

## Testing and verification
- Pack validation tests for all DP document types.
- Factory creation tests for DP docs under the IB pack.
- Regression tests ensuring PYP/MYP definitions still pass after the DP additions.

## Feature flags / rollout controls
- Keep behind `ib_pack_v2` until live frontend cutover is ready.
- Do not create deep DP UI binding in this task; later operational tasks will do that.

## Acceptance criteria
- The pack is now broad enough to describe the IB product across PYP, MYP, and DP.
- The later coordinator and DP operational tasks can rely on structured DP schema instead of ad hoc UI state.

## Handoff to the next task
- Task 10 finalizes pack workflows, framework bindings, and migration rules across the full IB domain.
