# 12 Feature Flag Rollout and Safety Gates

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Create controlled, reversible rollout mechanics for curriculum pack transformation using tenant cohorts, surface-level subflags, and production safety gates.

## Current State and Gap
Current state:
- Feature flags exist, including `curriculum_profiles_v1`, but are not wired to most curriculum behavior paths.

Grounding references:
- [`apps/core/app/models/feature_flag.rb`](../../apps/core/app/models/feature_flag.rb)
- [`apps/core/app/controllers/api/v1/admin/feature_flags_controller.rb`](../../apps/core/app/controllers/api/v1/admin/feature_flags_controller.rb)
- [`apps/core/spec/requests/api/v1/admin/feature_flags_spec.rb`](../../apps/core/spec/requests/api/v1/admin/feature_flags_spec.rb)

Gap summary:
- No staged curriculum rollout matrix.
- No mandatory safety gate thresholds.
- No structured rollback orchestration.

## Scope
### In Scope
- Define feature flag matrix for all curriculum build surfaces.
- Define tenant cohort rollout process.
- Define production gate metrics and auto-halt policy.
- Define rollback sequencing.

### Out of Scope
- Provider-specific deployment orchestration.
- CI infrastructure redesign.

## Flag Matrix
### Core gate
- `curriculum_profiles_v2_core`

### Subflags
- `curriculum_pack_lifecycle_v1`
- `curriculum_profile_version_pinning_v1`
- `curriculum_resolution_observability_v1`
- `planner_schema_renderer_v1`
- `runtime_nav_composition_v1`
- `profile_derived_surfaces_v1`
- `curriculum_workflow_engine_v1`
- `district_curriculum_governance_v1`
- `integration_curriculum_envelope_v1`
- `curriculum_security_derived_only_v1`

All subflags require core gate enabled.

## Data Model Changes
Optional additive fields for `feature_flags` (if needed for governance):
- `metadata` jsonb (rollout notes, owner, ticket)
- `expires_at` datetime (auto-expiry for temporary gates)

No destructive changes required.

## API and Contract Changes
### Existing endpoint extension
- `GET /api/v1/admin/feature_flags` should include dependency metadata (`requires`, `blocked_by`).

### New endpoint
- `POST /api/v1/admin/feature_flags/rollout_plan/execute`

### Example rollout request
```json
{
  "key": "curriculum_profiles_v2_core",
  "target_tenant_ids": [101, 103, 109],
  "mode": "enable",
  "reason": "Pilot cohort phase 2"
}
```

### Example rollout response
```json
{
  "executed": 3,
  "failed": 0,
  "results": [
    {"tenant_id": 101, "status": "enabled"}
  ]
}
```

## Rollout and Migration Plan
1. Enable observability-only flags first.
2. Enable lifecycle and version pinning for pilot tenants.
3. Enable UI composition features after backend stability.
4. Enable integration envelope changes.
5. Enable workflow and district governance features.
6. Expand cohort based on gate metrics.

## Safety Gates
### Required SLO thresholds (per tenant)
- Resolver fallback rate < 0.5%
- Planner schema render failure < 1%
- Integration envelope missing rate < 0.5%
- Unauthorized mutation attempts with unexpected success = 0

### Auto-halt rules
If any threshold breached for 15 minutes:
1. Halt new cohort rollouts.
2. Auto-disable latest enabled subflag for affected tenant cohort.
3. Create incident and attach telemetry snapshots.

## UI and UX Behavior Changes
Admin feature flag UI enhancements:
- Show dependency graph and rollout cohort status.
- Show current gate health status per tenant.
- Show “last auto-halt event” details.

## Authorization and Security Constraints
- Only admin can execute rollout operations.
- District admins may view but not globally modify tenant flags outside delegated scope.
- All flag mutations audited with actor, tenant list, and reason.

## Monitoring and Alerts
Metrics:
- `feature_flags.rollout_execute_count`
- `feature_flags.rollout_failure_count`
- `feature_flags.auto_halt_count`
- `feature_flags.curriculum_enabled_tenant_count`

Alerts:
- Any auto-halt event.
- Rollout failure count > 0 during execution.

## Test Matrix
### Request
- Admin can execute rollout plans.
- Non-admin rollout execution denied.

### Unit
- Dependency evaluation for flags.
- Auto-halt rule evaluator logic.

### Integration
- Rollout changes affect only target tenant cohort.

### Regression
- Disabling core flag correctly suppresses subfeature behavior.

## Acceptance Criteria
1. Curriculum features can be enabled/disabled per tenant cohort.
2. Safety gates are measurable and enforced with auto-halt.
3. Feature dependencies are validated before activation.
4. Rollout and rollback actions are fully audited.
5. Admin UI displays gate health and dependencies clearly.

## Risks and Rollback
### Risks
- Partial flag activation causing inconsistent user experience.
- Missing telemetry leading to false confidence.

### Rollback
1. Disable `curriculum_profiles_v2_core` for affected cohort.
2. Confirm legacy behavior paths restored.
3. Re-enable only after metrics normalize and incident closed.

## Codex Execution Checklist
1. Add curriculum v2 flag matrix and dependency map.
2. Extend feature flag API with dependency and rollout metadata.
3. Implement rollout execution endpoint with tenant batch handling.
4. Implement safety gate evaluator and auto-halt mechanism.
5. Update admin UI for dependency/health visualization.
6. Add request/unit/integration tests for cohort isolation and auto-halt.
7. Add alerting on auto-halt and rollout failures.
