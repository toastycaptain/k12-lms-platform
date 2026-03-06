# Task 16 — IB STEP4 PROGRAMME OPERATIONS BACKEND AGGREGATES AND RISK SERVICES

## Position in sequence
- **Step:** 4 — Build the coordinator/admin IB Operations Center
- **Run after:** Task 15
- **Run before:** Task 17 binds the Programme Operations Center frontend to these live aggregates.
- **Primary mode:** Backend + Frontend

## Objective
Create the backend aggregate services, risk scoring, queue health, and exception summaries that power a real Programme Operations Center for coordinators and IB leaders.

## Why this task exists now
A useful coordinator console cannot be built by stitching raw lists together in the browser. It needs backend-level aggregation, thresholds, and risk semantics so leaders see exceptions first instead of dumping tables.

## Current repo anchors
- `apps/web/src/features/ib/operations/ProgrammeOperationsCenter.tsx`
- `apps/web/src/features/ib/home/CoordinatorOverview.tsx`
- `apps/core/app/services/ib/*` (new)
- `apps/core/app/controllers/api/v1/ib/*` (new operations endpoints)
- `apps/core/app/models/curriculum_document.rb`
- future evidence, POI, project, and DP core models from Steps 5–6

## Scope
- Define programme-health aggregates for whole school, PYP, MYP, and DP views.
- Define risk/service objects for approvals waiting, publishing backlog, evidence queue health, specialist coverage gaps, POI overlap, criteria imbalance, IA risk, CAS/EE/TOK lag, and standards/practices evidence completeness.
- Support role-aware payloads for PYP coordinator, MYP coordinator, DP coordinator, admin, and district admin.

## Backend work
- Create query/service objects such as `Ib::Operations::ProgrammeHealthSnapshot`, `Ib::Operations::QueueHealthSnapshot`, `Ib::Operations::RiskSummary`, or similar.
- Return precomputed cards, counts, and drilldown hints rather than raw record lists only.
- Parameterize thresholds and warning bands so Task 18 can later expose configuration in admin surfaces.
- Design for partial data: when later subsystems are not yet fully live, operations payloads should degrade gracefully but preserve structure.

## Frontend work
- Prepare hooks and types for the operations payload but keep most visual binding for Task 17.

## Data contracts, APIs, and model rules
- Payload should contain sections like `summary_metrics`, `priority_exceptions`, `queues`, `programme_tabs`, `drilldowns`, `thresholds_applied`, and `generated_at`.
- Include machine-readable `risk_reason_codes` so the frontend can explain why a card is red or amber without hardcoding reasoning in React.

## Risks and guardrails
- Do not let operations payloads become giant all-purpose dumps.
- Do not compute expensive per-card queries in loops; use aggregated services designed for coordinator traffic.

## Testing and verification
- Service tests for risk scoring and threshold application.
- Request specs for operations endpoints across at least two coordinator roles.
- Performance checks on aggregate queries to ensure the operations center will not become the slowest page in the product.

## Feature flags / rollout controls
- Flag with `ib_operations_center_v1` if necessary.
- Do not block all progress on perfect risk scoring before wiring the screen; ship sensible, documented first-pass rules.

## Acceptance criteria
- There is a real backend substrate for an exception-first coordinator console.
- Later frontend work can drill into risks and queues without inventing backend semantics.

## Handoff to the next task
- Task 17 binds the Programme Operations Center frontend to these live aggregates.
