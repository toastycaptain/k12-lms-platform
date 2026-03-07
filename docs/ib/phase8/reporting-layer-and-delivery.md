# IB Phase 8 Reporting Layer and Delivery

This document closes Tasks `215` through `222`.

## Reporting architecture
- report domain models:
  - `apps/core/app/models/ib_report.rb`
  - `apps/core/app/models/ib_report_version.rb`
  - `apps/core/app/models/ib_report_delivery.rb`
  - `apps/core/app/models/ib_delivery_receipt.rb`
- reporting orchestration:
  - `apps/core/app/services/ib/reporting/report_service.rb`
  - `apps/core/app/jobs/ib/reporting/report_delivery_job.rb`
  - `apps/core/app/controllers/api/v1/ib/reports_controller.rb`

Phase 8 establishes a shared report contract instead of separate one-off programme exports. Reports now persist version history, rendered payloads, sign-off state, delivery channels, and receipt/read state.

## PYP, MYP, and DP live-data reporting
- PYP evidence/story synthesis is generated in `Ib::Reporting::ReportService#build_pyp_payload`
- MYP criteria and ATL snapshots are generated in `Ib::Reporting::ReportService#build_myp_payload`
- DP progress, IA, and core milestone reporting is generated in `Ib::Reporting::ReportService#build_dp_payload`
- conference packet generation is handled by `Ib::Reporting::ReportService#build_conference_payload`

The report pipeline pulls from live evidence, learning stories, and operational records. It does not create a separate reporting-only data silo.

## Web delivery and family/student visibility
- teacher/coordinator workspace: `apps/web/src/features/ib/reports/IbReportsWorkspace.tsx`
- route entry point: `apps/web/src/app/ib/reports/page.tsx`
- family/student released-report surface: `apps/web/src/features/ib/reports/ReleasedReportsPanel.tsx`
- guardian/student integration:
  - `apps/web/src/features/ib/guardian/GuardianExperience.tsx`
  - `apps/web/src/features/ib/student/StudentExperience.tsx`
  - `apps/core/app/services/ib/guardian/home_payload_builder.rb`
  - `apps/core/app/services/ib/student/home_payload_builder.rb`

Reports can now be drafted, signed off, released, delivered, marked read, and acknowledged through one workflow.

## Delivery hardening and proofing
- proofing summary and render payload generation: `apps/core/app/services/ib/reporting/report_service.rb`
- channel support exists for `web`, `pdf`, `email`, and `conference_packet` on `IbReportDelivery`
- delivery receipts keep read/ack state user-specific and auditable

This stream is web-first in UI, but the backend rendering/delivery contract is already channel-aware so print/PDF flows do not require a second model.

## QA and validation
- backend request coverage: `apps/core/spec/requests/api/v1/ib_phase8_api_spec.rb`
- guardian/student report-state tests:
  - `apps/web/src/features/ib/guardian/GuardianExperience.test.tsx`
  - `apps/web/src/features/ib/student/StudentExperience.test.tsx`

## Exit signal for this stream
Tasks `215` through `222` are complete when:
- every report family shares one persisted version/delivery model;
- report content is rendered from live IB data;
- release, delivery, read, and acknowledgement states are auditable;
- the guardian/student experience reflects the same released report state as staff.
