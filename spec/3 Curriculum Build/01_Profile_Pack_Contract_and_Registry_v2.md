# 01 Profile Pack Contract and Registry v2

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Define a v2 curriculum profile pack contract that can fully drive runtime composition for navigation, planning schemas, workflows, reporting, and capability modules while preserving the existing stack and additive architecture.

## Current State and Gap
The current implementation supports profile identity and basic planner labels/defaults but does not support pack-driven runtime composition.

Current implementation anchors:
- [`apps/core/app/services/curriculum_profile_registry.rb`](../../apps/core/app/services/curriculum_profile_registry.rb)
- [`apps/core/app/services/curriculum_profile_resolver.rb`](../../apps/core/app/services/curriculum_profile_resolver.rb)
- [`packages/contracts/curriculum-profiles/profile.schema.json`](../../packages/contracts/curriculum-profiles/profile.schema.json)
- [`packages/contracts/curriculum-profiles/ib_continuum_v1.json`](../../packages/contracts/curriculum-profiles/ib_continuum_v1.json)
- [`apps/web/src/app/plan/units/new/page.tsx`](../../apps/web/src/app/plan/units/new/page.tsx)

Gap summary:
- `profile.schema.json` lacks navigation, workflow, report, and module composition sections.
- Registry validates only required keys, not deeper semantic constraints.
- Resolver returns labels/options only; no pack-driven UI/workflow/reporting metadata.

## Scope
### In Scope
- Introduce `profile.v2.schema.json` and v2 pack shape.
- Define strict validation and rejection semantics.
- Define registry loading behavior for mixed v1/v2 packs.
- Define compatibility adapter from v1 to v2 at load time.
- Define serialized resolver payload additions consumed by frontend and integrations.

### Out of Scope
- Implementing admin lifecycle endpoints (covered in File 02).
- Implementing DB pinning/freeze persistence (covered in File 03).
- Implementing renderer/UI migrations (covered in Files 06-08).

## Data Model Changes
No new runtime curriculum tables are required for this contract-definition phase.

Additive-only artifact changes:
- Add `packages/contracts/curriculum-profiles/profile.v2.schema.json`.
- Keep existing v1 pack files and schema file during compatibility window.

Persistence expectations:
- Registry behavior remains file-backed and in-memory at this phase.
- No destructive migration is permitted.
- If a persistence layer for pack metadata is introduced later (File 02 lifecycle hardening), it must be additive and tenant-safe.

## v2 Contract Definition
Create new artifact:
- `packages/contracts/curriculum-profiles/profile.v2.schema.json`

Maintain existing v1 files for compatibility during migration.

### Required top-level fields (v2)
- `identity`
- `versioning`
- `terminology`
- `navigation`
- `planner_object_schemas`
- `workflow_bindings`
- `report_bindings`
- `capability_modules`
- `integration_hints`
- `status`

### `identity`
- `key` (stable profile key, e.g. `ib_continuum`)
- `jurisdiction`
- `label`
- `description`

### `versioning`
- `version` (semantic or date stamp)
- `compatibility` (`v1_compatible`, `v2_only`)
- `supersedes` (optional prior version pointer)

### `terminology`
- Labels and aliases used by runtime surfaces (examples: `unit_label`, `scheme_label`, `stage_label`, `subject_label`).

### `navigation`
- Role-aware navigation groups and item ordering.
- Item keys must map only to approved route registry entries.

### `planner_object_schemas`
- Declarative schemas for `unit_plan`, `lesson_plan`, `template`, and optional curriculum-specific variants.
- Includes tabs, sections, field types, validation, visibility, and default value rules.

### `workflow_bindings`
- Object-to-workflow mapping keys.
- No executable logic in pack; references declarative workflow definitions only.

### `report_bindings`
- Report layout and default filter blocks by profile.
- References approved report block registry IDs.

### `capability_modules`
- Explicit booleans and config for optional modules (portfolio, interventions, pastoral, gradebook extensions).

### `integration_hints`
- Standard integration tags for Google, LTI, OneRoster, and Classroom context envelope injection.

## Validation Rules and Rejection Behavior
### Schema validation
- JSON Schema draft 2020-12.
- `additionalProperties: false` at every structured object boundary except explicitly open metadata maps.

### Semantic validation
- Reject duplicate `identity.key + versioning.version`.
- Reject unknown route keys in `navigation`.
- Reject unknown component IDs in planner schemas.
- Reject unknown workflow/report binding IDs.
- Reject script payloads, HTML templates, executable code, or dynamic function expressions.

### Rejection behavior
- Registry logs warning with pack file and validation failures.
- Invalid packs are excluded from active set.
- If active pack becomes invalid, resolver falls back to last known good version; if none, system fallback profile.

## Registry Loading, Deduping, and Fallback
### Loading order
1. Read all pack JSON files under `packages/contracts/curriculum-profiles`.
2. Split v1 and v2 artifacts.
3. Normalize v1 into v2 in-memory via compatibility adapter.
4. Validate normalized pack against v2 schema.
5. Build active set keyed by `key + version`.

### Deduping
- Same `key + version`: reject all duplicates, keep first deterministic path order and emit conflict event.

### Fallback rules
- First fallback: tenant/school/course pinned version (if valid).
- Second fallback: tenant default active version.
- Third fallback: registry default (`american_common_core_v1` legacy alias mapped to v2 key/version).
- Fourth fallback: embedded minimal system profile payload.

## Compatibility Adapter (v1 -> v2)
Adapter maps existing v1 fields into v2 sections:
- `key`, `label`, `description`, `jurisdiction` -> `identity`
- `version` -> `versioning.version`
- `planner_taxonomy` + options -> `terminology` and `planner_object_schemas.defaults`
- `framework_defaults`, `template_defaults`, `integration_hints` -> same-named v2 sections
- Missing `navigation`, `workflow_bindings`, `report_bindings`, `capability_modules` -> safe defaults

Adapter behavior must be deterministic and side-effect free.

## API and Contract Changes
Update OpenAPI and contract artifacts:
- [`apps/core/config/openapi/core-v1.openapi.yaml`](../../apps/core/config/openapi/core-v1.openapi.yaml)
- [`packages/contracts/core-v1.openapi.yaml`](../../packages/contracts/core-v1.openapi.yaml)

### Endpoint impact
- `GET /api/v1/curriculum_profiles` now returns v2-normalized contract.
- Existing consumers must not break when new fields appear.

### Example response payload
```json
[
  {
    "identity": {
      "key": "ib_continuum",
      "label": "IB Continuum",
      "jurisdiction": "International Baccalaureate",
      "description": "IB profile for PYP/MYP/DP"
    },
    "versioning": {
      "version": "2026.2",
      "compatibility": "v2_only"
    },
    "terminology": {
      "unit_label": "Unit of Inquiry",
      "subject_label": "Subject Group",
      "stage_label": "Programme Year"
    },
    "navigation": {
      "teacher": ["dashboard", "continuum", "planner", "courses", "reports"]
    },
    "status": "active"
  }
]
```

## UI and UX Behavior Changes
- Admin curriculum profile catalog page displays v2 sections for preview.
- New validation status badges per profile version.
- Existing pages continue to use current behavior until Files 06-08 are implemented.

## Authorization and Security Constraints
- `GET /api/v1/curriculum_profiles` remains admin-only.
- Non-admin users receive only derived fields through domain payloads.
- Pack artifacts are treated as untrusted input and fully validated before activation.

## Rollout and Migration Plan
1. Add `profile.v2.schema.json` and adapter code paths.
2. Load existing v1 artifacts through adapter.
3. Update serializer and OpenAPI examples.
4. Add v2 pack fixtures for IB/US/UK.
5. Enable registry strict mode behind feature flag from File 12.

## Monitoring and Alerts
Emit metrics and alerts:
- `curriculum_registry.load_success_count`
- `curriculum_registry.load_failure_count`
- `curriculum_registry.adapter_v1_usage_count`
- `curriculum_registry.fallback_to_system_count`

Alert thresholds:
- Any load failure in deploy window.
- System fallback rate > 0.5% of resolver calls over 15 minutes.

## Test Matrix
### Unit
- Schema validator accepts valid v2 pack and rejects invalid shape.
- Adapter maps v1 into valid v2 defaults.

### Request/Contract
- `GET /api/v1/curriculum_profiles` matches updated OpenAPI schema.

### Security
- Non-admin access returns `403`.
- Malicious payload patterns are rejected.

### Regression
- Existing v1 packs still resolve successfully during migration.

## Acceptance Criteria
1. A v2 schema artifact exists and is enforced in registry load path.
2. Existing v1 profiles continue to resolve via adapter.
3. Invalid packs never enter active resolver set.
4. OpenAPI and contract definitions are synchronized with v2 response shape.
5. Admin-only policy behavior remains unchanged.

## Risks and Rollback
### Risks
- Over-strict schema may block legitimate legacy packs.
- Adapter bugs could silently change semantics.

### Rollback
1. Disable strict v2 mode via feature flag (File 12).
2. Revert resolver to current v1-only interpretation path.
3. Keep logs for invalid pack diagnostics.

## Codex Execution Checklist
1. Add `profile.v2.schema.json` in `packages/contracts/curriculum-profiles`.
2. Implement v1->v2 adapter in registry service layer.
3. Add semantic validators for nav/workflow/report/component references.
4. Update `CurriculumProfileRegistry` load path to normalize and validate.
5. Add unit tests for valid/invalid/dedupe/adapter behavior.
6. Update `GET /api/v1/curriculum_profiles` response contract docs.
7. Add metrics and structured logs for load/fallback events.
8. Verify admin-only access behavior remains enforced.
