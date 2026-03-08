# Phase 10 Multi-Curriculum Extraction

## Scope
- Tasks `445` to `454`
- Goal: extract reusable engines from the IB implementation without mutating current IB tenant behavior

## What changed
- Added a shared platform-primitive inventory:
  - `Curriculum::PlatformPrimitiveRegistry`
- Added a normalized capability contract for any pack payload:
  - `Curriculum::PackCapabilitySchema`
- Added reusable adapters around current IB-backed engines:
  - `Curriculum::DocumentTemplateRegistry`
  - `Curriculum::WorkflowTemplateLibrary`
  - `Curriculum::ReportingEngine`
  - `Curriculum::PublishingCapability`
  - `Curriculum::MigrationConnectorSDK`
  - `Curriculum::GovernanceConsoleRegistry`
- `CurriculumPackStore.fetch(..., with_metadata: true)` now exposes:
  - `capability_schema`
  - `primitive_inventory`

## Integration points
- `Curriculum::WorkflowRegistry` now resolves through `WorkflowTemplateLibrary`, so the shared workflow library is not dead code.
- `Ib::Reporting::ReportService` now publishes a shared reporting-engine contract inside the report contract payload.
- `Ib::Publishing::DispatchService` records the shared publishing contract into publish metadata.
- `Ib::Migration::SessionService` now exposes connector SDK contracts instead of raw registry constants.
- `Ib::Governance::RolloutConsoleService` now includes a shared console contract.

## Frontend runtime extraction
- The curriculum runtime subset now carries:
  - `reportBindings`
  - `capabilityModules`
  - `integrationHints`
- This supports a frontend capability summary without leaking IB-only assumptions into generic runtime helpers.
- Admin pack catalog cards now expose a compact capability summary so pack operators can verify extraction coverage without opening raw JSON.

## Compatibility gates
- New schema: `packages/contracts/curriculum-pack-vnext.schema.json`
- Contract spec validates normalized capability schemas for:
  - `ib_continuum_v1`
  - `american_common_core_v1`
  - `british_cambridge_v1`
- Runtime request spec verifies the extracted fields stay available in `/api/v1/curriculum_profiles?runtime=true`.
- Frontend helper tests validate capability summaries against normalized runtime payloads.

## Instrumentation
- `curriculum.pack.metadata_fetch`
  - emitted when runtime consumers fetch pack metadata with extraction fields attached
- `curriculum.pack.runtime_payload.requested`
  - emitted when the runtime subset is requested for a signed-in user

## Non-goals
- This does not launch non-IB products.
- This does not replace existing pack payloads or old runtime fields.
- This does not flatten IB-specific programme semantics into fake generic routes.
