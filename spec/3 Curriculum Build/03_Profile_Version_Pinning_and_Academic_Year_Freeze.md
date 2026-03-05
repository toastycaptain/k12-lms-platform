# 03 Profile Version Pinning and Academic Year Freeze

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Prevent mid-year curriculum drift by introducing explicit profile-version pinning and academic-year freeze controls across course, school, and tenant resolution layers.

## Current State and Gap
Current state:
- Resolver precedence is key-only (`course > school > tenant > system`) without version pinning.
- No freeze semantics tied to academic year lifecycle.

Grounding references:
- [`apps/core/app/services/curriculum_profile_resolver.rb`](../../apps/core/app/services/curriculum_profile_resolver.rb)
- [`apps/core/app/models/course.rb`](../../apps/core/app/models/course.rb)
- [`apps/core/app/models/school.rb`](../../apps/core/app/models/school.rb)
- [`apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb`](../../apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb)
- [`apps/core/db/migrate/20260302090100_backfill_curriculum_profile_defaults.rb`](../../apps/core/db/migrate/20260302090100_backfill_curriculum_profile_defaults.rb)

Gap summary:
- Profile keys can silently shift to newer semantics.
- Existing courses and plans are not locked to profile version.
- Academic-year boundaries do not enforce controlled cutover.

## Scope
### In Scope
- Version-aware assignment model.
- Year-bound freeze model.
- Resolver precedence including explicit version.
- Serializer additions for effective version and freeze metadata.
- Migration and backfill strategy.

### Out of Scope
- Pack lifecycle implementation details (File 02).
- Workflow engine details (File 09).

## Data Model Changes
### `curriculum_profile_assignments`
- `tenant_id` bigint not null
- `assignable_type` string not null (`Tenant`, `School`, `Course`, `AcademicYear`)
- `assignable_id` bigint not null
- `profile_key` string not null
- `profile_version` string not null
- `state` string not null (`active`, `pending_cutover`, `retired`)
- `effective_from` datetime not null
- `effective_to` datetime nullable
- indexes:
  - `tenant_id, assignable_type, assignable_id`
  - `tenant_id, profile_key, profile_version`

### `curriculum_profile_freezes`
- `tenant_id` bigint not null
- `academic_year_id` bigint not null
- `locked_profile_key` string not null
- `locked_profile_version` string not null
- `frozen_by_id` bigint not null
- `frozen_at` datetime not null
- `notes` text nullable
- unique index on `tenant_id, academic_year_id`

## Resolver v2 Precedence
Resolver evaluation order (version-aware):
1. Course assignment (`profile_key + profile_version`) if active.
2. School assignment if active.
3. Academic year freeze assignment (if frozen for course year).
4. Tenant assignment if active.
5. System fallback profile key/version.

Conflict handling:
- If key/version does not exist in active registry release set, resolver logs `fallback_reason=missing_release` and continues to next level.

## API and Contract Changes
### New endpoints
1. `GET /api/v1/admin/curriculum_assignments`
2. `PUT /api/v1/admin/curriculum_assignments`
3. `POST /api/v1/admin/curriculum_freezes`
4. `DELETE /api/v1/admin/curriculum_freezes/:academic_year_id`

### Extended payload fields
Add to course serializer payload:
- `effective_curriculum_profile_key`
- `effective_curriculum_profile_version`
- `effective_curriculum_source`
- `effective_curriculum_freeze_active`
- `effective_curriculum_frozen_by_academic_year_id`

### Example assignment update request
```json
{
  "tenant_default": {
    "profile_key": "american_common_core",
    "profile_version": "2026.2"
  },
  "school_overrides": [
    {"school_id": 3, "profile_key": "ib_continuum", "profile_version": "2026.2"}
  ],
  "course_overrides": [
    {"course_id": 19, "profile_key": "ib_continuum", "profile_version": "2026.1"}
  ]
}
```

### Example freeze request
```json
{
  "academic_year_id": 8,
  "locked_profile_key": "ib_continuum",
  "locked_profile_version": "2026.1",
  "notes": "Lock for SY 2026-2027 moderation stability"
}
```

## UI and UX Behavior Changes
Admin surfaces:
- `/admin/curriculum-profiles`: show key and version selectors.
- `/admin/school`: show effective version and freeze badges.
- New freeze panel by academic year.

Teacher-facing surfaces:
- Planner context badge includes `profile_key@version` and freeze indicator.

## Authorization and Security Constraints
- Only `admin` can mutate assignments or freeze state.
- `curriculum_lead` is read-only for effective context visualization.
- Non-admin users receive derived version data only.
- All mutation endpoints audited with actor and previous/new value snapshots.

## Rollout and Migration Plan
1. Add new assignment/freeze tables and models.
2. Backfill tenant-level assignment from existing `tenant.settings.curriculum_default_profile_key` using active release version.
3. Backfill school assignments from `schools.curriculum_profile_key`.
4. Keep existing key-only fields during transitional reads.
5. Switch resolver to version-aware mode behind flag `curriculum_profile_version_pinning_v1`.
6. After stability, remove key-only write paths.

## Monitoring and Alerts
Metrics:
- `curriculum_resolver.versioned_resolution_count`
- `curriculum_resolver.missing_release_fallback_count`
- `curriculum_freeze.active_count`
- `curriculum_freeze.override_attempt_denied_count`

Alerts:
- Missing-release fallback > 0.2% for any tenant over 15 minutes.
- Freeze mutation failures > 5 in 10 minutes.

## Test Matrix
### Unit
- Resolver picks correct key/version by precedence.
- Freeze overrides tenant default.

### Request
- Admin can create/update assignments and freezes.
- Non-admin mutation requests return `403`.

### Serialization
- Course payload always includes effective version fields.

### Migration
- Backfill scripts populate assignments for existing tenants/schools.

## Acceptance Criteria
1. Resolver returns deterministic key/version/source for every course.
2. Academic-year freeze prevents unintended version drift.
3. Admin can manage assignments/freeze state through documented APIs.
4. Existing tenants migrate without breaking planner flows.
5. Missing release versions trigger safe fallback and diagnostics.

## Risks and Rollback
### Risks
- Incorrect backfill could pin wrong version for legacy tenants.
- Freeze misuse could block intended term transitions.

### Rollback
1. Disable `curriculum_profile_version_pinning_v1`.
2. Resolver returns to key-only mode using existing fields.
3. Keep assignment/freeze tables intact for data recovery.
4. Reconcile bad assignments and re-enable in staged cohorts.

## Codex Execution Checklist
1. Add assignment and freeze migrations/models with tenant scoping and indexes.
2. Implement version-aware assignment services and policies.
3. Extend resolver precedence logic with version selection.
4. Extend serializers with effective version and freeze metadata.
5. Add admin endpoints for assignment and freeze management.
6. Add backfill job for tenant and school assignment migration.
7. Add request/unit/migration tests.
8. Add feature flag gating and staged rollout plan.
