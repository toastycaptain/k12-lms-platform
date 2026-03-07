# Phase 7 Coordinator Intelligence Release Gates

## Goal
Task 181 gates the coordinator stream on decision support quality, not just dashboard density.

## Required flows
- open the operations center and view exception-first cards
- inspect the drilldown matrix and queue SLA watch
- review recommendations and standards overlays
- generate or view a shareable summary token
- verify data-mart-backed summaries remain permission-safe

## Release gates
| Gate | Threshold | Evidence |
|---|---|---|
| Operations center route readiness | `/ib/operations` loads within the seeded guardrail | `apps/web/e2e/ib/coordinator-intelligence.spec.ts` |
| Exception-first posture | visible cards, bottlenecks, and SLA rows exist before deeper drilldowns | `ProgrammeOperationsCenter`, `QueueIntelligenceService` |
| Recommendation telemetry | recommendation and export surfaces can emit consistent coordinator event-family telemetry | event model + operations services |
| Shareability control | share token is server-generated and expires | `ExportService`, shareable view panel |
| Governance clarity | intelligence visibility stays inside admin / coordinator routes and school scope | existing route guards + scoped payload builders |

## Visibility and retention rules
- school scope must be preserved on every operations query
- route links should resolve canonically, not through legacy or demo paths
- share tokens must be temporary and leadership-summary only
- recommendations may be suggestive, never silently mutative

## Go / no-go checklist
- operations route passes seeded E2E
- data mart snapshot renders without missing buckets
- queue bottlenecks and recommendations are visible on the same page load
- route stability and latency are within the current guardrails
- no cross-school data is visible from seeded admin walkthroughs
