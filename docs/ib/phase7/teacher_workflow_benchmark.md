# Phase 7 Teacher Workflow Benchmark

## Scope
This benchmark brief closes Tasks 152 to 160 for teacher workflow speed and establishes the baseline that later pilot telemetry should replace. The current numbers are seeded-environment proxy baselines backed by `Ib::Support::WorkflowBenchmarkService`, the new Playwright timing harness, and the Phase 7 event model.

## Baseline principles
- Measure what teachers actually do repeatedly, not what demos make look impressive.
- Count clicks, route transitions, and time-to-ready separately.
- Keep specialist, coordinator, student, and family friction visible so teacher wins do not shift cost to other roles.
- Treat seeded proxy timing as a guardrail until pilot schools generate a representative event stream.

## Top 20 workflows
| Workflow | Programme | Frequency | Current baseline | Target | Click target | Measurement source | Priority |
|---|---|---:|---:|---:|---:|---|---|
| Open teacher action console and resume the top item | Mixed | Daily | 49s | 45s | 3 | `WorkflowBenchmarkService`, `teacher-workflow-benchmark.spec.ts` | P0 |
| Validate evidence from the inbox | Mixed | Daily | 32s | 30s | 2 | `WorkflowBenchmarkService`, `performance-budgets.spec.ts` | P0 |
| Publish a family-ready story | PYP/Mixed | Daily | 38s | 35s | 2 | `WorkflowBenchmarkService`, `performance-budgets.spec.ts` | P0 |
| Approve a coordinator exception | Mixed | Daily | 27s | 25s | 2 | `WorkflowBenchmarkService`, `coordinator-intelligence.spec.ts` | P0 |
| Request a specialist contribution | Mixed | Weekly | 43s | 40s | 3 | `WorkflowBenchmarkService`, Phase 7 event model | P0 |
| Pin active work from home | Mixed | Daily | 12s | 8s | 1 | `TeacherActionConsole`, `ib.activity_events` | P1 |
| Duplicate a document from home | Mixed | Weekly | 18s | 12s | 2 | `DuplicateDocumentDialog`, `ib.document_duplicated` | P1 |
| Carry work forward into a new cycle | Mixed | Weekly | 25s | 18s | 2 | `BulkCarryForwardPanel`, route telemetry | P1 |
| Reorder sequence blocks in studio | Mixed | Weekly | 24s | 16s | 2 | `SequenceBoard`, `SequenceBlockEditor` | P1 |
| Search and deep-link into IB work | Mixed | Daily | 14s | 6s | 1 | `IbSearchDialog`, `CommandPalette` | P1 |
| Restore recent work after route change | Mixed | Daily | 10s | 4s | 1 | `ActionConsoleService#recent_history` | P1 |
| Recover from offline draft mode | Mixed | Weekly | 36s | 20s | 2 | mutation queue telemetry, conflict dialog | P1 |
| Clear coordinator comments from home | Mixed | Weekly | 20s | 12s | 2 | `TeacherActionConsole`, review route telemetry | P1 |
| Open current evidence triage on mobile | Mixed | Daily | 16s | 8s | 1 | mobile tray telemetry | P1 |
| Move from home into DP risk follow-up | DP | Weekly | 19s | 10s | 1 | route telemetry, `operations_center` | P1 |
| Resume PYP publishing from a story draft | PYP | Weekly | 21s | 12s | 1 | story route telemetry | P1 |
| Resume MYP project follow-up | MYP | Weekly | 23s | 14s | 1 | operational record route telemetry | P2 |
| Resume DP EE/TOK/CAS follow-up | DP | Weekly | 24s | 14s | 1 | operational record route telemetry | P2 |
| Open readiness blockers without leaving home context | Mixed | Weekly | 17s | 9s | 1 | `ReadinessService`, `ActionConsoleService` | P2 |
| Reopen a recently viewed IB route from the command palette | Mixed | Daily | 9s | 4s | 1 | `ib.command.execute`, `ib.search.open_result` | P2 |

## Cross-role friction notes
- Specialist friction remains highest around cross-grade handoff visibility and library reuse discoverability. Phase 7 reduces this via the specialist dashboard, rapid attach, and seeded specialist E2E coverage.
- Coordinator friction remains dominated by exception triage and deciding whether an issue is local or programme-wide. Phase 7 addresses this with the operations data mart, bottleneck panels, and recommendation surfacing.
- Student and family friction moves from navigation volume to clarity and noise. Release gates for those streams focus on calmness, accessibility, and next-action comprehension rather than raw feature count.

## Target deltas
- Teacher planning: reduce median completion time by 30% to 50% once live pilot telemetry replaces seeded proxy values.
- Evidence review: make the common validate-or-request-reflection path a 1 to 2 click action from the teacher home or evidence inbox.
- Family publish: keep preview-to-publish under 35 seconds median and one route transition.
- Search and route recovery: keep command palette and deep-link usage to one interaction and near-zero dead-end navigation.
- Offline recovery: keep conflict resolution explicit and keep replay from feeling safer than refresh-and-pray.

## Timing harness
- Backend: `apps/core/app/services/ib/support/workflow_benchmark_service.rb`
- Frontend: `apps/web/e2e/ib/helpers.ts`
- Route coverage: `apps/web/e2e/ib/teacher-workflow-benchmark.spec.ts`, `apps/web/e2e/ib/performance-budgets.spec.ts`
- Event sink: `apps/core/app/controllers/api/v1/ib/activity_events_controller.rb`

## Prioritized backlog from the current benchmark
1. Replace seeded proxy durations with real percentiles from pilot traffic before raising thresholds.
2. Instrument sequence drag-drop, carry-forward completion, and offline replay with canonical completion events.
3. Collapse duplicate modal confirmations in duplication and carry-forward flows where policy allows.
4. Add route-prefetch for the most common teacher quick actions when the home console settles.
5. Push benchmark snapshots into the admin analytics console so readiness reviews show workflow deltas, not only route health.
