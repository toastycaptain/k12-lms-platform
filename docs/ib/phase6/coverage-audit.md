# IB Phase 6 Coverage Audit

This audit maps Tasks 100 through 150 to the checked-in implementation and documentation.

## Step 1 — Build integrity and release discipline
- repo integrity and archive verification: `scripts/ib_repo_integrity.sh`, `scripts/ib_archive_verify.sh`, `docs/ib/phase6/repo-integrity.md`, `docs/ib/phase6/critical-manifest.txt`
- CI/deploy baseline and release gate: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `scripts/ib_pilot_release_gate.sh`, `docs/ib/phase6/ci-baseline.md`, `docs/ib/phase6/release-candidate-checklist.md`
- frozen baseline and rollback guidance: `apps/core/app/models/feature_flag.rb`, `apps/core/app/services/ib/support/pilot_baseline_service.rb`, `docs/ib/phase6/pilot-baseline.md`, `docs/ib/phase6/rollback-and-recovery.md`

## Step 2 — Real pilot-school enablement
- pilot setup domain and mutation/status engine: `IbPilotSetup`, `Ib::Support::PilotSetupStatusEngine`, `Ib::Support::PilotSetupMutationService`
- setup/readiness APIs and UI: `apps/core/app/controllers/api/v1/ib/pilot_setups_controller.rb`, `apps/web/src/features/ib/admin/PilotSetupWizard.tsx`, `apps/web/src/features/ib/admin/PilotReadinessConsole.tsx`, `docs/ib/phase6/rollout-admin-runbooks.md`
- support tooling: `apps/web/src/features/ib/admin/RolloutConsole.tsx`, `apps/web/src/features/ib/admin/OnboardingSupportPanel.tsx`

## Step 3 — Migration and import tooling
- staged import models and services: `IbImportBatch`, `IbImportRow`, `Ib::Migration::*`
- parser + source mappers: `apps/core/app/services/ib/migration/parser.rb`, `apps/core/app/services/ib/migration/source_mapper.rb`
- mapping/dry-run/execute/rollback/admin surface: `apps/web/src/features/ib/admin/ImportOperationsConsole.tsx`, `apps/core/app/controllers/api/v1/ib/import_batches_controller.rb`, `docs/ib/phase6/import-pipeline-and-operations.md`
- telemetry and replay: `apps/core/app/services/ib/support/job_operations_service.rb`, `apps/web/src/features/ib/admin/JobOperationsConsole.tsx`

## Step 4 — True end-to-end testing
- seeded smoke infrastructure: `apps/core/lib/tasks/e2e_seed.rake`, `apps/web/e2e/ib-smoke.spec.ts`, `docs/ib/phase6/e2e-and-fixtures.md`

## Step 5 — Background jobs and notifications
- publishing/export hardening: `apps/core/app/services/ib/publishing/dispatch_service.rb`, `apps/core/app/services/ib/standards/export_service.rb`
- deduplicated notifications: `apps/core/app/models/notification.rb`, `apps/core/app/models/notification_preference.rb`, `apps/core/app/services/notification_service.rb`
- replay console: `apps/core/app/controllers/api/v1/ib/job_operations_controller.rb`, `apps/web/src/features/ib/admin/JobOperationsConsole.tsx`, `docs/ib/phase6/jobs-notifications-hardening.md`

## Step 6 — Support as product surface
- support content model and guided UI: `apps/web/src/features/curriculum/support/OperationalChecklistPanel.tsx`, `apps/web/src/features/ib/admin/OnboardingSupportPanel.tsx`, `docs/ib/phase6/support-content-model.md`

## Step 7 — Operational analytics for friction
- frontend/admin analytics helper: `apps/web/src/features/ib/admin/analytics.ts`
- backend scorecard aggregation: `apps/core/app/services/ib/support/analytics_service.rb`
- contract and scorecard docs: `docs/ib/phase6/analytics-contract.md`

## Step 8 — Mobile parity
- mobile triage and responsive rollout hooks: `apps/web/src/features/ib/mobile/*`, `apps/web/src/features/ib/admin/RolloutConsole.tsx`, `docs/ib/phase6/mobile-and-qa-matrix.md`

## Step 9 — Document-system consolidation
- canonical document route helper + redirects: `apps/web/src/features/ib/document-routes.ts`, `apps/web/src/curriculum/documents/DocumentList.tsx`, `apps/web/src/curriculum/modules/PlanDocumentModule.tsx`, `apps/web/src/curriculum/modules/PlanDocumentsModule.tsx`, `docs/ib/phase6/document-consolidation.md`

## Step 10 — Cross-curriculum extraction
- shared primitive inventory and reuse rubric: `docs/ib/phase6/shared-platform-extraction.md`
- closeout and next-phase signal: `docs/ib/phase6/post-phase6-closeout.md`

## Audit conclusion
Phase 6 now leaves IB in a launchable state with governed setup, readiness, import, replay, analytics, mobile triage, and document-consolidation guardrails. The remaining work is live-pilot feedback and future curriculum reuse, not another speculative IB feature wave.
