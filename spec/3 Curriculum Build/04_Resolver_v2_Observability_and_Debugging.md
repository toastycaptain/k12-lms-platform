# 04 Resolver v2 Observability and Debugging

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Provide deterministic, diagnosable curriculum resolution behavior with structured observability and admin diagnostics, reducing ambiguity when profile inheritance/fallbacks occur.

## Current State and Gap
Current resolver output includes key fields but not full traceability.

Grounding references:
- [`apps/core/app/services/curriculum_profile_resolver.rb`](../../apps/core/app/services/curriculum_profile_resolver.rb)
- [`apps/core/app/serializers/course_serializer.rb`](../../apps/core/app/serializers/course_serializer.rb)
- [`apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb`](../../apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb)
- [`apps/core/app/models/feature_flag.rb`](../../apps/core/app/models/feature_flag.rb)

Gap summary:
- No correlation ID for a specific resolution path.
- No explicit `fallback_reason` output.
- No diagnostics endpoint for admin support workflows.

## Scope
### In Scope
- Resolver output v2 shape.
- Resolver cache/invalidation rules.
- Admin diagnostics endpoint and payload.
- Metrics/logging/alert definitions.

### Out of Scope
- Pack lifecycle storage (File 02).
- Assignment/freeze persistence changes (File 03).

## Data Model Changes
Primary implementation is non-destructive and does not require new mandatory tables.

Additive options (recommended for higher observability retention):
- Extend existing audit/telemetry storage to include `resolution_trace_id` and resolver metadata fields.
- Optionally introduce a tenant-scoped diagnostics event table only if log retention requirements cannot be met from existing pipelines.

Constraints:
- Any optional persistence must include `tenant_id` (`NOT NULL`) and index coverage.
- Resolver request paths must remain read-optimized and avoid write amplification on hot paths.

## Resolver Output Contract (v2)
Add fields to all resolved context payloads:
- `profile_key`
- `profile_version`
- `source_level`
- `selected_from`
- `fallback_reason` (nullable)
- `resolution_trace_id`
- `resolved_at`
- `resolver_build_version`

### `selected_from` enum
- `course_assignment`
- `school_assignment`
- `academic_year_freeze`
- `tenant_assignment`
- `system_fallback`

### `fallback_reason` enum
- `missing_profile_key`
- `missing_profile_version`
- `invalid_profile_state`
- `pack_validation_error`
- `cache_miss_recovered`

## API and Contract Changes
### New endpoint
- `GET /api/v1/admin/curriculum_resolution/diagnostics`

Query options:
- `course_id`
- `school_id`
- `academic_year_id`
- `include_trace=true|false`

### Example diagnostics response
```json
{
  "course_id": 19,
  "effective": {
    "profile_key": "ib_continuum",
    "profile_version": "2026.1",
    "selected_from": "school_assignment",
    "fallback_reason": null,
    "resolution_trace_id": "crx_01J8JK...",
    "resolved_at": "2026-03-04T21:14:08Z"
  },
  "candidates": [
    {"level": "course", "key": null, "version": null, "eligible": false},
    {"level": "school", "key": "ib_continuum", "version": "2026.1", "eligible": true},
    {"level": "tenant", "key": "american_common_core", "version": "2026.2", "eligible": true}
  ]
}
```

### Serializer extension
Extend course payload in [`apps/core/app/serializers/course_serializer.rb`](../../apps/core/app/serializers/course_serializer.rb) with trace fields behind admin-only include toggle.

## Caching and Invalidation
### Cache key
`curriculum_resolver:v2:tenant:{tenant_id}:course:{course_id}:school:{school_id}:academic_year:{academic_year_id}`

### TTL
- Default 5 minutes.
- Force refresh when lifecycle publish/rollback/freeze/assignment mutation occurs.

### Invalidation triggers
- Pack publish/deprecate/freeze/rollback event.
- Curriculum assignment write.
- Academic-year freeze write/delete.

## UI and UX Behavior Changes
Admin diagnostics panel additions to `/admin/curriculum-profiles`:
1. “Resolve Context” tool accepting course/school inputs.
2. Candidate chain visualization by precedence.
3. Copyable `resolution_trace_id` for support tickets.
4. Fallback warnings with remediation suggestions.

## Authorization and Security Constraints
- Diagnostics endpoint is admin-only.
- Non-admin payloads never expose full candidate chain.
- Trace IDs are opaque; no sensitive metadata encoded in ID.
- All diagnostics reads are tenant-scoped and audited.

## Rollout and Migration Plan
1. Add resolver v2 output fields in service and serializers.
2. Add diagnostics endpoint and policy.
3. Add admin diagnostics UI.
4. Enable via feature flag `curriculum_resolution_observability_v1`.
5. Expand rollout per tenant cohort.

## Monitoring and Alerts
### Metrics
- `curriculum_resolver.resolve_count`
- `curriculum_resolver.fallback_count`
- `curriculum_resolver.cache_hit_rate`
- `curriculum_resolver.resolve_latency_ms`
- `curriculum_resolver.diagnostics_request_count`

### Structured log fields
- `tenant_id`
- `course_id`
- `profile_key`
- `profile_version`
- `selected_from`
- `fallback_reason`
- `resolution_trace_id`
- `duration_ms`

### Alerts
- Fallback ratio > 1% per tenant over 15 minutes.
- P95 resolve latency > 75ms for 30 minutes.

## Test Matrix
### Unit
- Resolver returns expected `selected_from` and `fallback_reason`.
- Trace ID format and uniqueness.

### Request
- Admin diagnostics endpoint returns expected contract.
- Non-admin access returns `403`.

### Integration
- Cache invalidates on publish/rollback/assignment update events.

### Contract
- OpenAPI schemas include diagnostics endpoint and new fields.

## Acceptance Criteria
1. Every resolution call emits `resolution_trace_id`.
2. Admin can retrieve deterministic candidate chain for debugging.
3. Fallback conditions are visible and machine-countable.
4. Cache invalidation keeps output consistent after config changes.
5. Non-admin users cannot access diagnostics internals.

## Risks and Rollback
### Risks
- Excessive diagnostics logging volume in high traffic tenants.
- Cache invalidation misses causing stale contexts.

### Rollback
1. Disable `curriculum_resolution_observability_v1`.
2. Continue core resolution without diagnostics endpoint.
3. Retain logs for incident analysis.

## Codex Execution Checklist
1. Extend resolver output contract with trace and fallback fields.
2. Implement deterministic trace ID generation and structured logging.
3. Implement diagnostics endpoint and admin policy.
4. Add resolver cache key strategy and invalidation hooks.
5. Update course serializer/admin UI with diagnostics info.
6. Add OpenAPI and contract updates.
7. Add unit/request/integration tests and alert configuration.
