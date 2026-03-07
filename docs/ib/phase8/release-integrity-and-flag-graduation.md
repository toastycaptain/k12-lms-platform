# IB Phase 8 Release Integrity and Flag Graduation

This document closes Tasks `202` through `207`.

## Release baseline and canonical starting point
- release-baseline domain: `apps/core/app/models/ib_release_baseline.rb`
- release-baseline service and mutation flow: `apps/core/app/services/ib/governance/release_baseline_service.rb`
- rollout and readiness aggregation: `apps/core/app/services/ib/governance/rollout_console_service.rb`, `apps/core/app/services/ib/support/pilot_readiness_service.rb`
- API surface: `apps/core/app/controllers/api/v1/ib/release_baselines_controller.rb`
- admin UI: `apps/web/src/features/ib/admin/RolloutConsole.tsx`, `apps/web/src/features/ib/admin/PilotReadinessConsole.tsx`

The Phase 8 baseline is no longer an informal checklist. A school now has a persisted IB release baseline record with verification, certification, and rollback actions exposed through the canonical `/api/v1/ib/release_baseline` surface.

## Build determinism and contract parity
- OpenAPI route coverage now includes the full IB API family in `packages/contracts/core-v1.openapi.yaml`
- release-critical route and readiness checks remain aggregated through the rollout/readiness consoles
- deterministic seed and E2E support remain anchored in `apps/core/lib/tasks/e2e_seed.rake`, `apps/web/e2e/helpers/seed.ts`, and `apps/web/e2e/helpers/auth.ts`

Phase 8 needed a contract-safe starting point. The IB routes are now documented in OpenAPI rather than relying on a partial undocumented namespace.

## Migration verification and rollback safety
- migration status is tracked on import batches in `apps/core/app/models/ib_import_batch.rb`
- import rows keep source payload and normalization state in `apps/core/app/models/ib_import_row.rb`
- verification, dry-run, execution, and rollback paths live in:
  - `apps/core/app/services/ib/migration/dry_run_service.rb`
  - `apps/core/app/services/ib/migration/execution_service.rb`
  - `apps/core/app/services/ib/migration/import_batch_service.rb`
  - `apps/core/app/controllers/api/v1/ib/import_batches_controller.rb`

These flows give release owners a reversible path from preview to import rather than forcing one-way migration commits.

## Flag inventory, dependency audit, and kill switches
- feature-flag model and bundle metadata: `apps/core/app/models/feature_flag.rb`
- flag inventory service: `apps/core/app/services/ib/governance/flag_catalog_service.rb`
- school-facing rollout payloads: `apps/core/app/services/ib/governance/rollout_console_service.rb`
- frontend consumption: `apps/web/src/features/ib/admin/api.ts`, `apps/web/src/features/ib/admin/RolloutConsole.tsx`

Task `205` and Task `206` required Phase 8 features to remain explicitly governable. The rollout console now exposes graduated flags, dependent bundles, and rollback-ready status instead of a single opaque “enabled” switch.

## GA-candidate operational sign-off
- readiness signals remain aggregated in `apps/core/app/services/ib/support/pilot_readiness_service.rb`
- teacher, specialist, guardian, student, and coordinator payloads now include the release-governance data needed for staged rollout decisions
- the Phase 8 contract gate is enforced by `apps/core/spec/contracts/openapi_spec.rb` and `apps/core/spec/contracts/openapi_validation_spec.rb`

## Exit signal for this stream
Tasks `202` through `207` are complete when:
- IB release state is persisted and API-backed;
- rollout and readiness are explainable at the tenant or school level;
- rollback paths exist for release and migration actions;
- the IB API namespace no longer bypasses the contract file.
