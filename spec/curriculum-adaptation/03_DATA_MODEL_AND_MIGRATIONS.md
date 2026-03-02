# Data Model and Migrations

## Objective
Introduce curriculum adaptation data structures with additive, backward-compatible changes.

## Additive Schema Changes
### 1) Schools
- Add column: `curriculum_profile_key` (`string`, nullable initially).
- Purpose: school-level override for effective curriculum.
- Index: `(tenant_id, curriculum_profile_key)`.

### 2) Courses
- Add column: `school_id` (`bigint`, nullable initially, FK to schools).
- Purpose: attach course to school for deterministic school-level profile resolution.
- Index: `school_id`.

### 3) Existing Settings (No new table required for v1)
- Tenant default: `tenants.settings["curriculum_default_profile_key"]`.
- Optional course override: `courses.settings["curriculum_profile_key"]`.

## Backfill Rules
1. If tenant has one school, assign that school to all tenant courses with null `school_id`.
2. If tenant has multiple schools and enrollment/section data can infer school, use that mapping.
3. If unresolved after inference, leave null and log unresolved course IDs for manual admin assignment.
4. If tenant default profile key is missing, set to `american_common_core_v1` as system-safe default.

## Resolver Contract
Implement `CurriculumProfileResolver.resolve(tenant:, school:, course:)` returning:
- `profile_key`
- `profile_version`
- `derived_labels`
- `framework_defaults`
- `planner_taxonomy`
- `source_level` (course/school/tenant/system)

## Compatibility Guarantees
- Existing endpoints continue functioning if all new fields are null.
- Resolver always returns a valid fallback profile key.
- No destructive migration or existing table removal.
