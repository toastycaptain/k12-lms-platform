# Phase 10 Step 6 — Migration Moat

## Scope covered
Tasks `415` to `430` are implemented through the migration adapter protocol layer, richer import manifests, shadow-mode and delta-rerun contracts, and upgraded operator surfaces.

## Backend contracts
- `Ib::Migration::ContractRegistry` now exposes:
  - source-specific adapter protocols
  - a shared import manifest schema
  - template generator inventory
  - source-artifact discovery guidance
- `Ib::Migration::ImportBatchService` now stamps each batch with:
  - `source_contract_version`
  - adapter connector metadata
  - source-artifact manifest
  - initial rollback/shadow-mode capabilities
- `Ib::Migration::DryRunService` now emits:
  - entity graph context
  - shadow-mode plan
  - delta-rerun support state
  - manual override panel requirements
- `Ib::Migration::SessionService` now exposes:
  - adapter protocols
  - shared manifest contract
  - confidence summary
  - source-manifest, shadow-mode, delta-rerun, and acceptance details per session

## Operator workflow improvements
- Import batches now show the adapter and protocol version they were validated against.
- Dry-run previews expose migration safeguards directly instead of hiding them inside free-form JSON.
- Rollout and migration confidence surfaces now expose:
  - shadow-mode readiness
  - delta-rerun support
  - rollback planning coverage
  - source-specific artifact expectations

## Frontend changes
- `ImportOperationsConsole` now shows:
  - adapter + contract version
  - source-artifact manifest counts
  - shadow-mode and delta-rerun safeguards
  - row-level data-loss risk and planned resolution strategy
- `MigrationConfidencePanel` now surfaces:
  - adapter protocols
  - confidence summary
  - available template generators

## Rollout notes
- The migration contract remains draft-first and resumable.
- Toddle and ManageBac stay source-aware without introducing separate import systems.
- Existing phase 6/8 import execution and rollback routes remain unchanged; this phase makes them more explicit and auditable.

## Validation
- Request coverage: `apps/core/spec/requests/api/v1/ib_phase10_step6_api_spec.rb`
- Frontend coverage: `apps/web/src/features/ib/admin/ImportOperationsConsole.test.tsx`
- Existing import execution regression coverage from earlier phases remains valid because the new fields are additive.

## Residual risks
- Shadow mode is modeled and observable, but true large-school source reconciliation still depends on real export quality from Toddle and ManageBac.
- Delta rerun readiness is explicit in the contract; the operational cadence still needs pilot usage to harden the heuristics.
