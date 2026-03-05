# 08 Profile Derived Standards Templates and Reports

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Apply effective curriculum profile context to standards browsing, template defaults, and reporting surfaces so each curriculum feels purpose-built while preserving shared backend primitives.

## Current State and Gap
Current state:
- Standards, template, and coverage pages are largely generic.
- Profile context is surfaced primarily in unit creation.

Grounding references:
- [`apps/web/src/app/plan/standards/page.tsx`](../../apps/web/src/app/plan/standards/page.tsx)
- [`apps/web/src/app/plan/templates/page.tsx`](../../apps/web/src/app/plan/templates/page.tsx)
- [`apps/web/src/app/admin/curriculum-map/page.tsx`](../../apps/web/src/app/admin/curriculum-map/page.tsx)
- [`apps/web/src/app/report/standards-coverage/page.tsx`](../../apps/web/src/app/report/standards-coverage/page.tsx)
- [`apps/core/app/controllers/api/v1/standards_coverage_controller.rb`](../../apps/core/app/controllers/api/v1/standards_coverage_controller.rb)

Gap summary:
- No profile-aware default framework/filter selection.
- No profile-driven template metadata initialization.
- Reporting blocks are not pack-configurable.

## Scope
### In Scope
- Define profile-derived standards defaults and filters.
- Define profile-derived template defaults and tags.
- Define profile-aware report blocks and preset filters.
- Preserve backward compatibility for current standards data.

### Out of Scope
- Workflow engine transitions (File 09).
- District inheritance governance mechanics (File 10).

## Data Model Changes
### Additive fields
1. `templates.settings` (jsonb, tenant-scoped) for profile-derived metadata:
- `profile_key`
- `profile_version`
- `default_sections_applied`
- `template_tags`

2. Optional `report_view_presets` table for saved profile report blocks:
- `tenant_id` not null
- `view_key` string not null
- `profile_key` string not null
- `profile_version` string not null
- `config` jsonb not null

## API and Contract Changes
### Standards APIs
Extend standards endpoints with optional context inputs:
- `GET /api/v1/standard_frameworks?effective_profile_key=...&effective_profile_version=...`
- `GET /api/v1/standards/tree?...`

### Template APIs
Extend template create/update responses to include derived metadata:
- `profile_key`
- `profile_version`
- `derived_template_defaults`

### Reporting APIs
Extend coverage/report endpoints to accept profile context and return profile block metadata:
- `GET /api/v1/academic_years/:id/standards_coverage?effective_profile_key=...`
- `GET /api/v1/courses/:id/standards_coverage?effective_profile_key=...`

### Example response fragment
```json
{
  "frameworks": [...],
  "profile_context": {
    "effective_profile_key": "american_common_core",
    "effective_profile_version": "2026.2",
    "recommended_framework_ids": [2, 7],
    "report_blocks": ["coverage_heatmap", "gap_priorities"]
  }
}
```

## UI and UX Behavior Changes
### Standards browser
- Preselect framework based on profile defaults.
- Show profile-context badge and source/version.

### Template library and creation
- Pre-populate sections/tags from profile `template_defaults`.
- Display profile-derived defaults indicator.

### Reports and curriculum map
- Render pack-specified report blocks.
- Apply default filters for grade/stage/subject from effective profile.

## Authorization and Security Constraints
- Derived context is visible to authorized users of those surfaces.
- Profile mutation remains admin-only and outside these endpoints.
- All data reads remain tenant-scoped and policy-scoped.

## Rollout and Migration Plan
1. Add backend optional profile context query handling.
2. Add derived metadata support in template payloads.
3. Add frontend defaulting logic in standards/templates/report pages.
4. Enable behind feature flag `profile_derived_surfaces_v1`.
5. Roll out by tenant cohort, monitor errors and user behavior.

## Monitoring and Alerts
Metrics:
- `profile_derived.defaults_applied_count`
- `profile_derived.defaults_missing_count`
- `profile_derived.report_block_render_count`
- `profile_derived.report_block_error_count`

Alerts:
- Missing defaults > 5% on standards/templates loads.
- Report block render errors > 1% over 15 minutes.

## Test Matrix
### Unit
- Derived defaults mapping from profile context is deterministic.

### Request/Contract
- Updated standards/templates/report responses match OpenAPI changes.

### Frontend
- Standards browser selects expected default framework by profile.
- Template creation applies profile tags/sections.
- Report page renders profile-defined block set.

### Regression
- Legacy behavior preserved when profile context unavailable.

## Acceptance Criteria
1. Standards pages default to profile-recommended frameworks.
2. Template defaults/tags are applied from effective profile.
3. Report pages render profile-specific block presets.
4. Behavior remains stable for tenants missing explicit profile config.
5. Contracts and UI tests cover new derived behavior.

## Risks and Rollback
### Risks
- Inconsistent defaults if profile mappings reference missing frameworks.
- Report block set drift between pack config and frontend registry.

### Rollback
1. Disable `profile_derived_surfaces_v1`.
2. Revert to generic standards/template/report defaults.
3. Keep profile context in payload for diagnostics only.

## Codex Execution Checklist
1. Extend standards/templates/report APIs with profile-context-aware defaults.
2. Update serializers/contracts with `profile_context` fields.
3. Add template settings metadata persistence for derived defaults.
4. Implement standards/template/report frontend defaulting logic.
5. Add profile-specific report block registry and rendering guards.
6. Add request/frontend/regression tests and OpenAPI updates.
7. Add telemetry for defaults applied/missing and block errors.
