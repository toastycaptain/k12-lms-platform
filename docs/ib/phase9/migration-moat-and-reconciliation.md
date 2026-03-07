# IB Phase 9 Migration Moat and Reconciliation

Covers task range `269` to `282`.

## What shipped
- Source-aware migration sessions and reusable mapping templates via `IbMigrationSession` and `IbMigrationMappingTemplate`.
- API coverage for migration session CRUD, template CRUD, and session inventory reporting.
- Rollout-console migration panel for session creation, template setup, and inventory summary.

## Migration model
- Sessions track source system, cutover state, mapping summary, dry-run summary, reconciliation summary, rollback summary, and source inventory.
- Templates capture field mappings, transform-library notes, and role-mapping rules in one reusable artifact.
- Transition validation enforces a staged cutover path: discovery, mapping, dry run, draft import, shadow mode, cutover ready, live, rollback, archive.

## Why this matters
- Phase 9 stops treating migration as a generic import job.
- The product now exposes a source-native migration spine that schools can review before cutover, rather than relying on console-only scripts or implied state.

## Remaining explicit gaps
- Source-specific parsers for Toddle and ManageBac still depend on the Phase 8 import-batch primitives rather than a dedicated per-source pipeline layer.
- Reconciliation export artifacts are summarized in-session today; downloadable school-facing closeout packs remain a follow-up.
