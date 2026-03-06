# Task 06 — IB STEP2 PACK EXPANSION FOUNDATION AND GOVERNANCE

## Position in sequence
- **Step:** 2 — Make the IB pack much richer
- **Run after:** Task 05
- **Run before:** Task 07 begins the concrete PYP schema expansion using this governed inventory.
- **Primary mode:** Backend + Frontend

## Objective
Upgrade the IB curriculum pack from a minimal starter pack into a governed, versioned domain pack capable of describing the operational IB product. This task establishes naming, versioning, pack governance, and the document-type inventory that the next PYP/MYP/DP schema tasks will fill in.

## Why this task exists now
The current IB pack is too narrow for the product already designed. If Codex expands pack content ad hoc without a governance layer, the pack will become inconsistent, unstable, and hard to migrate.

## Current repo anchors
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json`
- `packages/contracts/curriculum-profiles/profile.v3.schema.json`
- `apps/core/app/services/curriculum/*`
- `apps/core/app/models/curriculum_profile_release.rb`
- `apps/core/app/models/curriculum_profile_assignment.rb`

## Scope
- Decide whether to introduce `ib_continuum_v2` or keep the same pack key with a higher version; document the decision and its migration consequences.
- Define the full document-type inventory the IB product needs, grouped by PYP, MYP, DP, mixed programme, evidence/family, standards/practices, and operations/support.
- Establish naming conventions for `document_type`, `schema_key`, workflow names, framework names, and report bindings.
- Write a pack-governance note in the repo that future pack changes must follow.

## Backend work
- Update the pack schema if new pack sections are required (for example richer `ui_schema`, relationship metadata, readiness rules, or role-specific layout hints).
- Ensure the pack can be published/resolved at runtime and pinned to documents without breaking existing IB documents.
- Add validation tests that load the expanded pack and verify schema compatibility.

## Frontend work
- Create or update frontend pack fixtures/types if new pack sections will be consumed by the UI later (for example programme-specific layout hints or readiness metadata).
- Do not bind new UI yet beyond any fixture/tests needed to validate the richer pack.

## Data contracts, APIs, and model rules
- Define a stable inventory of document types before writing programme-specific schemas. Example groups include `ib_pyp_programme_of_inquiry`, `ib_pyp_unit`, `ib_pyp_weekly_flow`, `ib_pyp_family_window`, `ib_pyp_exhibition`, `ib_myp_unit`, `ib_myp_interdisciplinary_unit`, `ib_myp_project`, `ib_myp_service_reflection`, `ib_dp_course_map`, `ib_dp_internal_assessment`, `ib_dp_tok`, `ib_dp_extended_essay`, `ib_dp_cas_experience`, `ib_dp_cas_project`, `ib_dp_cas_reflection`, `ib_learning_story`, and `ib_standards_practices_evidence_packet`.
- Define framework namespaces to support later alignment work: transdisciplinary themes, learner profile, PYP concepts, MYP global contexts, MYP concepts, ATL, MYP criteria, DP core categories, CAS outcomes, IB standards/practices references, etc.
- Define a migration table mapping current starter document types (`unit_plan`, `lesson_plan`, `template`) to target IB-specific types where appropriate.

## Risks and guardrails
- Do not add one-off schema keys that only make sense to a single frontend component name.
- Do not let pack naming drift from the route/object model defined in Step 1.
- Do not make the pack so generic that it loses IB meaning.

## Testing and verification
- Add contract tests that validate the pack inventory and naming conventions.
- Ensure `profile.v3.schema.json` rejects malformed or incomplete IB pack definitions.
- Document the pack-governance decisions in a checked-in markdown file under `spec/ib-phase3-codex-tasks/support/`.

## Feature flags / rollout controls
- Use `ib_pack_v2` as the master flag for pack cutover.
- Keep the existing pack resolvable during the migration; do not break already-created documents without a migration path.

## Acceptance criteria
- There is a stable and reviewed IB document-type inventory.
- The pack schema can express the metadata the later tasks need.
- There is a written governance note that future Codex runs can follow without improvising names or structures.

## Handoff to the next task
- Task 07 begins the concrete PYP schema expansion using this governed inventory.
