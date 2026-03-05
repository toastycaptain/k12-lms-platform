# 13 Derived Only Security Hardening

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Enforce strict derived-only behavior for non-admin roles by hardening policies, serializers, and route guards so curriculum governance data cannot be mutated or leaked outside admin paths.

## Current State and Gap
Current state:
- Curriculum profile and settings endpoints are admin-only.
- Some general serializers and endpoints expose raw profile fields that are not required for non-admin users.

Grounding references:
- [`apps/core/app/policies/curriculum_profile_policy.rb`](../../apps/core/app/policies/curriculum_profile_policy.rb)
- [`apps/core/app/policies/curriculum_settings_policy.rb`](../../apps/core/app/policies/curriculum_settings_policy.rb)
- [`apps/core/app/serializers/school_serializer.rb`](../../apps/core/app/serializers/school_serializer.rb)
- [`apps/core/app/policies/school_policy.rb`](../../apps/core/app/policies/school_policy.rb)
- [`apps/core/app/controllers/api/v1/schools_controller.rb`](../../apps/core/app/controllers/api/v1/schools_controller.rb)

Gap summary:
- Need explicit contract stating what non-admin roles can and cannot see.
- Need route/controller matrix to prevent accidental exposure as features expand.
- Need dedicated security tests for derived-only guarantees.

## Scope
### In Scope
- Policy hardening for curriculum mutation paths.
- Serializer hardening for non-admin data exposure.
- Route/controller guard matrix.
- Security tests and audit event standards.

### Out of Scope
- Identity/auth provider changes.
- Non-curriculum policy refactors unrelated to this feature set.

## Data Model Changes
No new business-domain entities are required for the hardening itself.

Additive persistence updates allowed:
- Add structured audit payload fields for denied curriculum mutations (`policy`, `action`, `role`, `resource`, `tenant_id`).
- Additive indexes for security-audit query patterns if existing audit tables are insufficient.

Constraints:
- No destructive schema changes.
- Any added persistence remains tenant-scoped and compliant with existing retention policy.

## Security Model
### Admin-only mutation surfaces
- Profile lifecycle endpoints (File 02)
- Assignment/freezes endpoints (File 03)
- District curriculum governance endpoints (File 10)
- Import/upload/validation endpoints

### Non-admin behavior
- Access only derived `effective_*` curriculum context fields on domain payloads.
- No access to raw pack artifacts, internal release states, or mutable settings.

## Data Exposure Policy
### Allowed for non-admin
- `effective_curriculum_profile_key`
- `effective_curriculum_profile_version`
- `effective_curriculum_source`
- optional display labels from resolved context

### Disallowed for non-admin
- raw `curriculum_profile_key` overrides on school/course assignment resources
- release lifecycle metadata (`checksum`, lifecycle state, import events)
- policy and governance internals

## API and Contract Changes
### Serializer updates
- Conditional serialization for admin vs non-admin on school/course/admin resources.
- Replace direct config fields with derived fields where needed.

### Endpoint contracts
- Explicitly document role visibility in OpenAPI descriptions.
- Add `403` responses for all mutation routes that non-admins may probe.

### Example non-admin school payload
```json
{
  "id": 5,
  "name": "North Campus",
  "timezone": "America/Los_Angeles",
  "effective_curriculum": {
    "profile_key": "ib_continuum",
    "profile_version": "2026.1",
    "source": "school"
  }
}
```

## UI and UX Behavior Changes
- Hide curriculum mutation controls from all non-admin roles.
- Show read-only derived context badges for non-admin users where relevant.
- Add “admin-only setting” tooltips in pages shared with curriculum leads.

## Authorization and Security Constraints
Role matrix:
- `admin`: full curriculum governance mutation + diagnostics.
- `curriculum_lead`: read-only derived context and review workflows only.
- `teacher`, `student`, `guardian`, `district_admin` (outside district governance scope): read-only derived context only.

All denied mutations must produce:
- HTTP `403`
- auditable security event with endpoint and actor role set

## Rollout and Migration Plan
1. Inventory all curriculum-related endpoints and serializers.
2. Apply policy guards and conditional serializer fields.
3. Add frontend role gating for controls.
4. Enable via flag `curriculum_security_derived_only_v1`.
5. Monitor denied mutation attempts and support noise.

## Monitoring and Alerts
Metrics:
- `curriculum_security.denied_mutation_count`
- `curriculum_security.unexpected_allow_count`
- `curriculum_security.serializer_leak_detected_count`

Alerts:
- Any `unexpected_allow_count > 0` is Sev-1.
- Sudden denied mutation spike may indicate probing or UI leak.

## Test Matrix
### Request
- All non-admin roles receive `403` for mutation endpoints.
- Admin roles succeed on authorized routes.

### Policy
- Pundit specs for each curriculum governance policy.

### Serializer
- Snapshot tests validate non-admin payload exclusion.

### Frontend
- Non-admin UI snapshots confirm no mutation controls rendered.

## Acceptance Criteria
1. Non-admin mutation attempts fail on all curriculum governance routes.
2. Non-admin payloads expose derived context only.
3. Admin-only internals remain hidden from non-admin APIs and UI.
4. Security-denied events are audited and queryable.
5. Security regression tests are mandatory in CI.

## Risks and Rollback
### Risks
- Over-restriction may block legitimate curriculum lead workflows.
- Serializer changes may break existing frontend expectations.

### Rollback
1. Disable `curriculum_security_derived_only_v1` if critical workflow break.
2. Restore previous serializer fields temporarily for impacted routes.
3. Keep deny-audit logs for root cause analysis before re-enable.

## Codex Execution Checklist
1. Build endpoint/role matrix for all curriculum-related routes.
2. Harden policies for every mutation path.
3. Implement conditional serializers by role.
4. Update frontend to hide mutation controls for non-admin users.
5. Add request/policy/serializer/frontend security tests.
6. Add telemetry and alerts for denied/allowed anomalies.
7. Validate OpenAPI includes explicit role and `403` documentation.
