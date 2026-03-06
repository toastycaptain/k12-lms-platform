# IB Phase 5 Coverage Audit

This audit maps the checked-in Phase 5 artifacts to Tasks 65-97.

## Route Contract and Materialization
- canonical route inventory: `docs/ib/phase5/route-inventory.md`
- shared route/page shell primitives: `apps/web/src/features/ib/layout/*`, `apps/web/src/features/ib/routes/*`
- canonical route registry + route builder parity tests: frontend registry tests and backend route-builder specs

## Pack, Schema, and Workflow Governance
- pack/workflow matrix: `docs/ib/phase5/pack-governance-and-workflow-matrix.md`
- rollout console backend/frontend: `apps/core/app/services/ib/governance/rollout_console_service.rb`, `apps/web/src/features/ib/admin/RolloutConsole.tsx`
- serializer visibility for pack/schema/workflow state: curriculum and IB serializers

## Governance Consoles
- programme settings backend/frontend: `ProgrammeSettingsResolver`, `ProgrammeSettingsConsole`
- review governance backend/frontend: `ReviewGovernanceService`, `ReviewQueue`
- pilot readiness backend/frontend: `PilotReadinessService`, `PilotReadinessConsole`

## Standards, Evidence, and Publishing
- standards export/job/artifact layer: `Ib::Standards::ExportService`, `IbStandardsExport`
- standards packet detail routes: `StandardsPacketDetail`, `StandardsCycleDetail`
- evidence filters + summary: `EvidenceItemsController#summary`, `InboxSummaryService`
- publishing operations + idempotent dispatch: `DispatchService`, `PublishingQueue`

## Migration and Release Controls
- legacy cutover/freeze policy: `docs/ib/phase5/legacy-cutover-and-backfill.md`
- telemetry taxonomy: `docs/ib/phase5/telemetry-and-readiness.md`
- release playbook: `docs/ib/phase5/release-playbook.md`

## Residual Explicitly Tracked Gaps
- `RouteBuilder` fallback to `/plan/documents/:id` remains intentionally visible until every IB document type has a canonical route.
- deprecated aliases remain in the registry for migration safety and are documented rather than hidden.
- documents-only mode is gated by `ib_documents_only_v1` and should be enabled school-by-school, not globally.
