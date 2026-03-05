# 10 District Curriculum Governance and Inheritance

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Enable district-level curriculum governance with explicit inheritance to tenant and school levels while preserving controlled local overrides and auditable resolution paths.

## Current State and Gap
Current state:
- District module supports coverage, schools, users, and template push.
- Curriculum profile assignment is tenant/school-focused; district default governance is not implemented.

Grounding references:
- [`apps/core/app/controllers/api/v1/district_controller.rb`](../../apps/core/app/controllers/api/v1/district_controller.rb)
- [`apps/core/app/models/district.rb`](../../apps/core/app/models/district.rb)
- [`apps/core/app/models/tenant.rb`](../../apps/core/app/models/tenant.rb)
- [`apps/web/src/app/district/dashboard/page.tsx`](../../apps/web/src/app/district/dashboard/page.tsx)
- [`apps/web/src/app/district/schools/page.tsx`](../../apps/web/src/app/district/schools/page.tsx)

Gap summary:
- No district-level curriculum settings endpoint.
- No inheritance visibility (`district -> tenant -> school -> course`) in admin UX.
- No district override governance constraints for curriculum configuration.

## Scope
### In Scope
- Add district curriculum governance APIs and policy model.
- Define inheritance precedence with district layer.
- Add district UI controls and traceability surfaces.
- Define controlled override and lock rules.

### Out of Scope
- Cross-district sharing marketplace behavior.
- District SIS replacement workflows.

## Inheritance Model
Final precedence:
1. `course override`
2. `school override`
3. `tenant default`
4. `district default`
5. `system fallback`

Each level includes explicit `profile_key` + `profile_version`.

## Data Model Changes
### Add district curriculum settings
Option A (preferred, additive in `districts.settings`):
- `curriculum_default_profile_key`
- `curriculum_default_profile_version`
- `override_policy` (`allow_school_override`, `require_district_approval`)

Option B (if explicit table preferred):
- `district_curriculum_settings` with `tenant_id` referencing district-owned tenancy model.

## API and Contract Changes
### New district endpoints
1. `GET /api/v1/district/curriculum_settings`
2. `PUT /api/v1/district/curriculum_settings`
3. `GET /api/v1/district/curriculum_inheritance_preview`
4. `POST /api/v1/district/curriculum_overrides/approve`

### Example settings response
```json
{
  "district_id": 2,
  "default": {
    "profile_key": "american_common_core",
    "profile_version": "2026.2"
  },
  "override_policy": {
    "allow_school_override": true,
    "require_district_approval": false
  }
}
```

### Example inheritance preview
```json
{
  "tenant_id": 14,
  "school_id": 55,
  "course_id": 201,
  "effective": {
    "profile_key": "ib_continuum",
    "profile_version": "2026.1",
    "source": "school"
  },
  "chain": [
    {"level": "course", "value": null},
    {"level": "school", "value": "ib_continuum@2026.1"},
    {"level": "tenant", "value": null},
    {"level": "district", "value": "american_common_core@2026.2"}
  ]
}
```

## UI and UX Behavior Changes
District pages:
- Add `/district/curriculum` management surface.
- Add inheritance preview table for district admins.
- Add tenant/school override indicators and approval status.
- Add bulk distribution actions for district-default updates.

Tenant admin pages:
- Show district lock badge when override policy restricts local changes.

## Authorization and Security Constraints
Role expectations:
- `district_admin`: manage district defaults and district-level approvals.
- `admin` (tenant): manage tenant/school overrides only when allowed by district policy.
- non-admin roles: read derived context only.

Security requirements:
- District queries must be constrained to current district only.
- Override approval events audited and immutable.
- No cross-district configuration visibility.

## Rollout and Migration Plan
1. Add district settings fields and policies.
2. Add district APIs and inheritance preview.
3. Add district UI controls.
4. Enable via feature flag `district_curriculum_governance_v1` for pilot districts.
5. Expand by district cohort.

## Monitoring and Alerts
Metrics:
- `district_curriculum.settings_update_count`
- `district_curriculum.override_denied_count`
- `district_curriculum.override_approved_count`
- `district_curriculum.inheritance_preview_request_count`

Alerts:
- Override denied spikes after district policy changes.
- District settings update failures > 1%.

## Test Matrix
### Request
- District admin can update district settings.
- Tenant admin blocked when district policy disallows override.

### Policy
- District scope isolation enforced.

### UI
- District inheritance preview accurately reflects chain and source.

### Regression
- Tenants without district continue to use tenant/school/system precedence.

## Acceptance Criteria
1. District defaults are configurable by district admins.
2. Resolver includes district layer in effective chain.
3. Override governance rules are enforced and auditable.
4. District and tenant UIs display effective source clearly.
5. Tenants not attached to a district remain unaffected.

## Risks and Rollback
### Risks
- Misconfigured district policy may block local operations unexpectedly.
- Large district rollouts can create sudden profile shifts.

### Rollback
1. Disable `district_curriculum_governance_v1`.
2. Revert precedence to `course > school > tenant > system`.
3. Retain district settings data for controlled reactivation.

## Codex Execution Checklist
1. Add district curriculum settings storage and policy enforcement.
2. Implement district settings and inheritance preview endpoints.
3. Extend resolver to include district default layer.
4. Build district curriculum admin UI with preview and policy controls.
5. Add audit events for district-level mutations and approvals.
6. Add request/policy/UI/regression tests.
7. Add metrics and alerts for governance behavior.
