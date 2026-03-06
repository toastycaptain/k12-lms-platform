# Task 17 — IB STEP4 PROGRAMME OPERATIONS FRONTEND CONSOLE AND DRILLDOWNS

## Position in sequence
- **Step:** 4 — Build the coordinator/admin IB Operations Center
- **Run after:** Task 16
- **Run before:** Task 18 adds role/governance configuration so coordinators and admins can own the operations model safely.
- **Primary mode:** Backend + Frontend

## Objective
Bind the coordinator and operations surfaces to live backend aggregates and turn them into a genuine exception-first IB Programme Operations Center with meaningful drilldowns.

## Why this task exists now
The frontend already gestures toward a polished operations center. This task makes it operational and intentionally more decisive, less cluttered, and less bureaucratic than older school systems.

## Current repo anchors
- Output from Task 16
- `apps/web/src/features/ib/operations/ProgrammeOperationsCenter.tsx`
- `apps/web/src/features/ib/home/CoordinatorOverview.tsx`
- `apps/web/src/features/ib/reports/ExceptionReportShell.tsx`
- `apps/web/src/features/ib/review/ReviewQueue.tsx`

## Scope
- Replace static cards, counts, and virtual-grid rows with live payloads from the new operations endpoints.
- Keep the screen exception-first: highlight what needs action, why, and where to go next.
- Provide programme-level switching (whole school / PYP / MYP / DP) without reloading into unrelated screen structures.
- Support deep drilldown to review, evidence, family publishing, POI, DP risk, and standards/practices pages.

## Backend work
- Only minimal backend adjustments if frontend binding reveals missing route/entity metadata or threshold context.

## Frontend work
- Wire the operations page, coordinator home, and exception report shell to the live data model.
- Render `risk_reason_codes` and threshold explanations clearly so coordinators understand why a card appears.
- Use compact cards, grouped queues, and drilldown rows rather than giant undifferentiated tables.
- Support mobile/high-density variants for “triage now, investigate later” coordinator use.

## Data contracts, APIs, and model rules
- Standardize how operations cards identify route targets and entity references for later telemetry.
- Use the same empty/loading/error language across operations, review, and reports to maintain trust.

## Risks and guardrails
- Do not overfill the console with low-signal metrics just because the backend can calculate them.
- Do not make every card open a generic list view; drilldowns should land on meaningful next actions.

## Testing and verification
- Frontend integration tests proving operations pages no longer import static operations-card arrays.
- Visual regression checks for whole-school vs programme-specific variants.
- Keyboard and screen-reader tests for drilldown grids and segmented controls.

## Feature flags / rollout controls
- Flag with `ib_operations_center_v1` until thresholds and queues are validated with real data.
- Do not show coordinator-only cards to ordinary teachers unless intentionally designed.

## Acceptance criteria
- The Programme Operations Center is live and useful.
- Coordinator home and operations surfaces are aligned on one data model.

## Handoff to the next task
- Task 18 adds role/governance configuration so coordinators and admins can own the operations model safely.
