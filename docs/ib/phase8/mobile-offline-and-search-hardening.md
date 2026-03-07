# IB Phase 8 Mobile, Offline, Search, and Operations Hardening

This document closes Tasks `246` through `256`.

## Mobile and offline trust
- offline mutation queue and recovery:
  - `apps/web/src/features/ib/offline/useIbMutationQueue.ts`
  - `apps/web/src/features/ib/offline/offlineStore.ts`
  - `apps/web/src/features/ib/offline/ConflictResolutionDialog.tsx`
- mobile evidence and specialist capture:
  - `apps/web/src/features/ib/evidence/MobileEvidenceTriage.tsx`
  - `apps/web/src/features/ib/specialist/SpecialistMobileCapture.tsx`
- reliable autosave and save-state feedback:
  - `apps/web/src/features/ib/shared/useSectionAutosave.ts`
  - `apps/web/src/features/ib/shared/SaveStatePill.tsx`

The trust rule for this stream is deterministic recovery. Phase 8 does not hide offline or conflict state behind optimistic UI alone.

## Search architecture and shareable query context
- search API and relevance layer:
  - `apps/core/app/controllers/api/v1/ib/search_controller.rb`
  - `apps/core/app/services/ib/search/unified_search_service.rb`
- saved-search model and controller:
  - `apps/core/app/models/ib_saved_search.rb`
  - `apps/core/app/controllers/api/v1/ib/saved_searches_controller.rb`
- frontend search and coordinator lenses:
  - `apps/web/src/features/ib/search/IbSearchDialog.tsx`
  - `apps/web/src/features/ib/search/SearchResultList.tsx`
  - `apps/web/src/features/ib/portfolio/PortfolioSearchBar.tsx`

Saved searches now carry share tokens and reusable scope metadata, which is the needed base for coordinator lenses and shareable query context.

## Performance budgets and background operations
- server instrumentation and telemetry:
  - `apps/core/app/services/ib/support/telemetry.rb`
  - `apps/core/app/services/ib/support/activity_event_service.rb`
  - `apps/core/app/services/ib/support/performance_budget_service.rb`
- job/export reliability:
  - `apps/core/app/services/ib/operations/export_service.rb`
  - `apps/core/app/jobs/ib/reporting/report_delivery_job.rb`
  - `apps/core/app/services/notification_service.rb`
- search/export/load validation remains backed by:
  - `apps/core/spec/requests/api/v1/ib_phase8_api_spec.rb`
  - `apps/web/src/features/ib/search/IbSearchDialog.test.tsx`

## Large-school hardening posture
- the IB API namespace is now documented in `packages/contracts/core-v1.openapi.yaml`
- rollout/readiness surfaces include migration and governance state needed for large-school launches
- seeded browser coverage continues to exercise the highest-risk staff and family routes under realistic IB personas

## Exit signal for this stream
Tasks `246` through `256` are complete when:
- offline queues are explicit and recoverable;
- mobile capture does not fork the data model;
- search can save, reuse, and share lenses;
- export/report/background operations stay observable under load-ready governance.
