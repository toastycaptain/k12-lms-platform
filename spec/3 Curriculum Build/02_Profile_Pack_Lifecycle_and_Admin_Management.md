# 02 Profile Pack Lifecycle and Admin Management

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Define the complete lifecycle for curriculum profile packs (validate, import, publish, deprecate, freeze, rollback) and provide admin-only management interfaces with full auditing.

## Current State and Gap
Current state:
- Admin can read and update profile key assignments.
- Import endpoint exists but returns `501` not implemented.

Grounding references:
- [`apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb`](../../apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb)
- [`apps/core/app/policies/curriculum_settings_policy.rb`](../../apps/core/app/policies/curriculum_settings_policy.rb)
- [`apps/web/src/app/admin/curriculum-profiles/page.tsx`](../../apps/web/src/app/admin/curriculum-profiles/page.tsx)
- [`apps/core/config/openapi/core-v1.openapi.yaml`](../../apps/core/config/openapi/core-v1.openapi.yaml)

Gap summary:
- No release lifecycle state model.
- No validation pipeline endpoint.
- No rollback controls.
- No operational runbook embedded in product workflow.

## Scope
### In Scope
- Lifecycle state machine and release governance model.
- Admin APIs for lifecycle actions.
- Admin UI sections for lifecycle control and visibility.
- Audit event schema for lifecycle operations.
- Rollback runbook and guardrails.

### Out of Scope
- Resolver pinning/freeze persistence internals (File 03).
- UI runtime composition adoption (Files 06-08).

## Lifecycle State Model
### States
- `draft`
- `validated`
- `published`
- `deprecated`
- `frozen`
- `rolled_back`

### Allowed transitions
1. `draft -> validated`
2. `validated -> published`
3. `published -> deprecated`
4. `published -> frozen`
5. `frozen -> deprecated` (only when no active year lock conflict)
6. `published|frozen -> rolled_back` (to specific prior published release)

Invalid transitions return `422` with transition reason.

## Data Model Changes
Add additive governance tables (tenant-scoped):

### `curriculum_profile_releases`
- `tenant_id` bigint not null
- `profile_key` string not null
- `version` string not null
- `state` string not null
- `checksum` string not null
- `schema_version` string not null
- `artifact_path` string not null
- `published_at` datetime
- `deprecated_at` datetime
- `frozen_at` datetime
- `rolled_back_from_release_id` bigint nullable
- unique index on `tenant_id, profile_key, version`

### `curriculum_profile_release_events`
- `tenant_id` bigint not null
- `curriculum_profile_release_id` bigint not null
- `event_type` string not null
- `actor_id` bigint not null
- `metadata` jsonb default `{}`
- `created_at` datetime

## API and Contract Changes
All endpoints under admin namespace and admin-only policy.

### New endpoints
1. `POST /api/v1/admin/curriculum_profiles/validate`
2. `POST /api/v1/admin/curriculum_profiles/import`
3. `POST /api/v1/admin/curriculum_profiles/:release_id/publish`
4. `POST /api/v1/admin/curriculum_profiles/:release_id/deprecate`
5. `POST /api/v1/admin/curriculum_profiles/:release_id/freeze`
6. `POST /api/v1/admin/curriculum_profiles/:release_id/rollback`
7. `GET /api/v1/admin/curriculum_profiles/releases`
8. `GET /api/v1/admin/curriculum_profiles/releases/:release_id/events`

### Example validate request
```json
{
  "profile_key": "ib_continuum",
  "version": "2026.2",
  "payload": {
    "identity": {"key": "ib_continuum", "label": "IB Continuum"}
  }
}
```

### Example validate response
```json
{
  "valid": true,
  "errors": [],
  "checksum": "sha256:8cb1...",
  "normalized_schema_version": "2.0"
}
```

### Example rollback request
```json
{
  "target_release_id": 41,
  "reason": "Regression in IB planner schema fields"
}
```

### OpenAPI work
Update both:
- [`apps/core/config/openapi/core-v1.openapi.yaml`](../../apps/core/config/openapi/core-v1.openapi.yaml)
- [`packages/contracts/core-v1.openapi.yaml`](../../packages/contracts/core-v1.openapi.yaml)

## UI and UX Behavior Changes
Update admin page at `/admin/curriculum-profiles`:
1. Add release table with state, version, checksum, timestamps.
2. Add action buttons: Validate, Publish, Deprecate, Freeze, Rollback.
3. Add lifecycle timeline panel from events endpoint.
4. Add guardrail dialogs before publish/rollback.
5. Add “current active release” banner per profile key.

## Authorization and Security Constraints
Role expectations:
- `admin`: full lifecycle actions.
- `curriculum_lead`, `teacher`, `student`, `guardian`, `district_admin`: no mutation access here.

Security requirements:
- Pundit enforce on all lifecycle actions.
- Every mutation writes immutable audit event.
- Import payloads are schema validated and rejected if not compliant.
- No executable fields accepted in payload.

## Rollout and Migration Plan
1. Add DB tables and models for release lifecycle.
2. Add validation/import/publish/deprecate/freeze/rollback services.
3. Replace current `501` import placeholder.
4. Add admin UI release controls.
5. Roll out behind feature gate `curriculum_pack_lifecycle_v1`.

## Monitoring and Alerts
Metrics:
- `curriculum_release.validate.success_count`
- `curriculum_release.validate.failure_count`
- `curriculum_release.publish.count`
- `curriculum_release.rollback.count`
- `curriculum_release.invalid_transition.count`

Alerts:
- Validation failure rate > 10% over 30 minutes.
- Any rollback event in production opens incident notification.

## Test Matrix
### Request specs
- Admin can perform each lifecycle action.
- Non-admin receives `403` for all lifecycle endpoints.
- Invalid transition returns `422`.

### Service specs
- Validation service returns deterministic error set.
- Rollback service re-activates target release only.

### UI tests
- Lifecycle actions visible only to admin.
- Confirmation dialogs appear for publish and rollback.

### Contract tests
- OpenAPI examples align with implementation payloads.

## Acceptance Criteria
1. Import endpoint is fully implemented (no `501` path remains).
2. Lifecycle transitions are enforced by state machine rules.
3. Rollback can restore prior release without manual DB edits.
4. All lifecycle mutations are audited and queryable in UI.
5. Non-admin mutation attempts are denied and tested.

## Risks and Rollback
### Risks
- Rollback to incompatible release could break derived UI.
- Human error in selecting target rollback release.

### Rollback strategy
1. Keep previous active release pointer available for one-click restore.
2. Disable lifecycle gate to pause further releases.
3. Re-activate last known good release and invalidate resolver cache.

## Codex Execution Checklist
1. Create lifecycle models/migrations for releases and events.
2. Implement state machine and transition guards.
3. Implement admin service objects for each lifecycle action.
4. Replace import placeholder endpoint with real workflow.
5. Add OpenAPI contract entries and examples.
6. Add admin UI release controls and timeline view.
7. Add request/service/UI tests for lifecycle behavior.
8. Add metrics, alerts, and rollback runbook docs.
