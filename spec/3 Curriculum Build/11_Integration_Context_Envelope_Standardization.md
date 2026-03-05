# 11 Integration Context Envelope Standardization

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Standardize a single effective curriculum context envelope across Google, Classroom, LTI, and OneRoster integration paths so downstream systems receive consistent metadata.

## Current State and Gap
Current state:
- Curriculum context is injected in several integration paths but shape is inconsistent and version is often omitted.

Grounding references:
- [`apps/core/app/controllers/api/v1/drive_controller.rb`](../../apps/core/app/controllers/api/v1/drive_controller.rb)
- [`apps/core/app/controllers/api/v1/addon_controller.rb`](../../apps/core/app/controllers/api/v1/addon_controller.rb)
- [`apps/core/app/controllers/api/v1/lti_resource_links_controller.rb`](../../apps/core/app/controllers/api/v1/lti_resource_links_controller.rb)
- [`apps/core/app/controllers/lti/deep_links_controller.rb`](../../apps/core/app/controllers/lti/deep_links_controller.rb)
- [`apps/core/app/jobs/one_roster_user_sync_job.rb`](../../apps/core/app/jobs/one_roster_user_sync_job.rb)
- [`apps/core/app/controllers/api/v1/assignments_controller.rb`](../../apps/core/app/controllers/api/v1/assignments_controller.rb)

Gap summary:
- No canonical envelope definition.
- Some integration flows do not include version/source details.
- No consistent validation and observability across integration handlers.

## Scope
### In Scope
- Define canonical envelope structure.
- Define mandatory injection points and field semantics.
- Define validation/logging standards for envelope presence.
- Define backward compatibility behavior.

### Out of Scope
- New external provider integrations.
- Full LTI protocol redesign.

## Data Model Changes
No new core domain tables are required.

Additive metadata changes:
- Extend integration metadata payloads stored in existing tables (for example sync mappings, job metadata, and resource link custom params) to include canonical `curriculum_context`.
- Preserve legacy metadata keys during migration window for backward compatibility.

Constraints:
- Stored metadata updates must remain tenant-scoped and index-safe where queryable.
- No destructive removals until migration completion and compatibility window close.

## Canonical Envelope Contract
Envelope key: `curriculum_context`

Required fields:
- `effective_curriculum_profile_key`
- `effective_curriculum_profile_version`
- `effective_curriculum_source`
- `resolution_trace_id`

Optional provider fields:
- `google_addon_context_tag`
- `lti_context_tag`
- `oneroster_context_tag`
- `classroom_context_tag`

### Example canonical envelope
```json
{
  "curriculum_context": {
    "effective_curriculum_profile_key": "ib_continuum",
    "effective_curriculum_profile_version": "2026.1",
    "effective_curriculum_source": "school",
    "resolution_trace_id": "crx_01J8JK...",
    "google_addon_context_tag": "ib_programme",
    "lti_context_tag": "ib",
    "oneroster_context_tag": "ib_programme"
  }
}
```

## Integration Injection Points
### Google Drive + Add-on
- Resource metadata in attach flows must include full envelope.

### Classroom
- Assignment push and grade sync flows must include envelope in sync metadata and mapping records.

### LTI
- Resource link `custom_params` and deep-link content items include full envelope.

### OneRoster
- Sync-created/updated course settings include standardized envelope key and fields.

## API and Contract Changes
Update schemas in OpenAPI for endpoints carrying integration metadata:
- Drive attach endpoints
- Add-on attach endpoints
- LTI resource link create/update
- Deep link response payload generation
- Assignment push/sync responses

### Example LTI custom params payload
```json
{
  "custom_params": {
    "curriculum_context": {
      "effective_curriculum_profile_key": "american_common_core",
      "effective_curriculum_profile_version": "2026.2",
      "effective_curriculum_source": "tenant",
      "resolution_trace_id": "crx_01J8LM...",
      "lti_context_tag": "us_ccss"
    }
  }
}
```

## UI and UX Behavior Changes
- Add integration debug panel (admin-only) showing latest envelope snapshots per provider.
- Show “profile context included” status badges in add-on/classroom admin diagnostics.

## Authorization and Security Constraints
- Envelope values are derived server-side; clients cannot set protected fields.
- Non-admin users can invoke normal integration actions, but cannot override envelope fields.
- All envelope reads/writes remain tenant-scoped.

## Rollout and Migration Plan
1. Introduce envelope helper service and shared serializer.
2. Update all listed integration handlers to use helper.
3. Keep legacy metadata keys for one release cycle while populating canonical envelope.
4. Remove legacy integration key paths after contract migration window.
5. Enable via feature flag `integration_curriculum_envelope_v1`.

## Monitoring and Alerts
Metrics:
- `integration.curriculum_envelope_present_count`
- `integration.curriculum_envelope_missing_count`
- `integration.curriculum_envelope_validation_error_count`

Alerts:
- Envelope missing > 0.5% for any provider over 15 minutes.
- Validation errors spike after deployment.

## Test Matrix
### Unit
- Envelope builder returns required fields and provider-specific tags.

### Request/Integration
- Each integration endpoint/job writes canonical envelope.

### Contract
- OpenAPI metadata schemas include envelope field where relevant.

### Regression
- Existing integrations continue functioning with backward-compatible metadata.

## Acceptance Criteria
1. All targeted integration paths include canonical envelope.
2. Envelope includes profile key, version, source, and trace ID.
3. Clients cannot spoof protected curriculum context fields.
4. Legacy metadata remains supported during migration window.
5. Missing/invalid envelopes are observable and alertable.

## Risks and Rollback
### Risks
- Provider-specific payload size constraints.
- Legacy clients expecting old key names only.

### Rollback
1. Disable `integration_curriculum_envelope_v1`.
2. Continue emitting legacy metadata keys.
3. Keep helper code for controlled reactivation after fixes.

## Codex Execution Checklist
1. Implement shared `CurriculumContextEnvelope` builder service.
2. Refactor Drive/Add-on/LTI/Classroom/OneRoster handlers to use builder.
3. Update metadata serializers/contracts with canonical envelope shape.
4. Preserve legacy keys during compatibility window.
5. Add provider-specific request/integration tests.
6. Add telemetry and alerts for missing/invalid envelopes.
