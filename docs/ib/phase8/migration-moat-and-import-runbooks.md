# IB Phase 8 Migration Moat and Import Runbooks

This document closes Tasks `208` through `214`.

## Source-specific contract layer
- contract registry: `apps/core/app/services/ib/migration/contract_registry.rb`
- preview contract builder: `apps/core/app/services/ib/migration/preview_service.rb`
- source mapping and normalization: `apps/core/app/services/ib/migration/source_mapper.rb`
- import batch orchestration: `apps/core/app/services/ib/migration/import_batch_service.rb`

Phase 8 moves the import stack from generic CSV ingestion toward source-aware migration contracts. The import services now distinguish source-system behavior instead of treating Toddle and ManageBac as the same shape.

## Toddle and ManageBac parsing/preview coverage
- import lifecycle model: `apps/core/app/models/ib_import_batch.rb`
- row-level normalization state: `apps/core/app/models/ib_import_row.rb`
- API entry point: `apps/core/app/controllers/api/v1/ib/import_batches_controller.rb`
- admin API wiring: `apps/web/src/features/ib/admin/api.ts`

The preview path now exposes normalized draft payloads and validation feedback before execute/rollback, which is the practical moat schools need when evaluating a migration.

## Dry-run validation and data-quality feedback
- dry-run evaluator: `apps/core/app/services/ib/migration/dry_run_service.rb`
- readiness drift integration: `apps/core/app/services/ib/governance/rollout_console_service.rb`
- readiness aggregation: `apps/core/app/services/ib/support/pilot_readiness_service.rb`

Migration problems are now surfaced as preview and readiness data rather than only showing up after import.

## Conflict resolution, coexistence mode, and rollback
- execution + rollback: `apps/core/app/services/ib/migration/execution_service.rb`
- route preservation and fallback safety continue through:
  - `apps/core/app/services/ib/route_builder.rb`
  - `apps/core/app/services/ib/support/route_resolution_service.rb`

The migration workflow remains import-to-draft first. That keeps CurriculumDocument as the source of truth while preserving reversibility and coexistence with legacy mapped content.

## Fixtures, support tooling, and adoption runbooks
- seeded migration support remains in `apps/core/lib/tasks/e2e_seed.rake`
- backend request coverage lives in `apps/core/spec/requests/api/v1/ib_phase8_api_spec.rb`
- factories for migration/reporting/collaboration state live in `apps/core/spec/factories/ib_phase8.rb`

## Exit signal for this stream
Tasks `208` through `214` are complete when:
- source-aware preview contracts exist;
- dry-run and execute are separate operations;
- rollback is explicit and auditable;
- readiness reporting can explain migration drift instead of hiding it.
