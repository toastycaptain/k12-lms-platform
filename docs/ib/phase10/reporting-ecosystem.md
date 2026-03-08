# Phase 10 Step 5 — Reporting Ecosystem

## Scope covered
Tasks `398` to `414` are implemented through the canonical reporting contract, deeper render/release/archive payloads, localization controls, delivery analytics, and the upgraded reporting workspace.

## Canonical report contract
- `Ib::Reporting::ReportService` is now the single source for:
  - family-specific payload generation
  - proofing and preflight warnings
  - render contracts for web, print, and PDF artifacts
  - localization and fallback state
  - release workflow and archive metadata
  - delivery analytics and acknowledgement visibility
- `Ib::Reporting::CycleService` now exposes the reporting command contract:
  - canonical families and render targets
  - proofing queue
  - localization pipeline
  - archive summary
  - release gates
  - analytics summary

## Programme-specific depth
- PYP reports now keep learner profile, ATL, family support, and conference prompts together.
- MYP reports now surface criteria snapshots, ATL signals, interdisciplinary links, and project summaries.
- DP reports now surface IA progress, EE/TOK/CAS status, transcript-bridge readiness, and risk watch.
- Conference packets now explicitly expose student-led prompts, family support, and acknowledgement expectations.

## Release and archive workflow
- Release remains human-gated: generate -> sign off -> release -> deliver.
- Delivery artifacts now carry:
  - artifact URL
  - archive key
  - feedback window
  - delivery analytics
  - proofing state snapshot
- Archive state is versioned per release and tied to a deterministic storage key.

## Localization and family delivery
- Guardian and student-facing outputs now expose:
  - default locale
  - available locales
  - fallback locales
  - human-review requirement
- Translation fallback is visible in proofing so a release can be blocked or consciously approved.

## Frontend changes
- `IbReportsWorkspace` now shows:
  - proofing warnings
  - artifact and archive details
  - localization and release workflow state
  - viewer permissions and conference-packet readiness
  - the canonical reporting contract from `useIbReportingOps`
- The existing `ReportingOperationsPanel` remains the operational command center and now sits on top of richer backend contracts.

## Operator notes
- No new feature flag was required; this extends the existing reporting route family.
- PDF delivery is represented as an artifact contract and Active Storage key. Worker fan-out can remain behind the existing job/reliability layer.
- The delivery log is now sufficient to debug release/read/acknowledgement drift without direct database inspection.

## Validation
- Request coverage: `apps/core/spec/requests/api/v1/ib_phase10_step5_api_spec.rb`
- Frontend coverage: `apps/web/src/features/ib/reports/IbReportsWorkspace.test.tsx`
- The contract is intentionally additive so existing guardian/student released-report surfaces continue to work.

## Residual risks
- PDF rendering is still represented as a deterministic artifact contract rather than a dedicated rendering worker fleet.
- Multilingual content is contractually visible, but true translation quality still depends on operator review and school glossary discipline.
