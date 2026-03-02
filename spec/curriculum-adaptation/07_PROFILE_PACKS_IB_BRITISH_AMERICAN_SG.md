# Profile Packs: IB, British, American, Singapore

## Objective
Define the required profile-pack contract and initial profile set used by the resolver and admin settings surfaces.

## Pack Files
Recommended location:
- `packages/contracts/curriculum-profiles/profile.schema.json`
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json`
- `packages/contracts/curriculum-profiles/british_cambridge_v1.json`
- `packages/contracts/curriculum-profiles/american_common_core_v1.json`
- `packages/contracts/curriculum-profiles/singapore_moe_v1.json`

## Required Profile Fields
- `key` (stable identifier)
- `label` (display name)
- `version` (semantic or date-based)
- `description`
- `jurisdiction`
- `planner_taxonomy`
- `subject_options`
- `grade_or_stage_options`
- `framework_defaults`
- `template_defaults`
- `integration_hints`
- `status` (`active`/`deprecated`)

## Validation Rules
1. Every profile must validate against `profile.schema.json`.
2. `key` is unique across all profile packs.
3. `framework_defaults` must reference known framework identifiers.
4. No profile may include executable/script payload content.

## Admin-Only Ingestion and Management
Profile pack ingestion/registration is admin-only.
Non-admin roles do not access pack management surfaces or ingestion APIs.

## Initial Pack Intent
- IB: inquiry-heavy taxonomy and IB framework defaults.
- British: stage-oriented taxonomy and British/Cambridge defaults.
- American: Common Core/NGSS-centric defaults.
- Singapore: MOE-aligned taxonomy and framework defaults.
