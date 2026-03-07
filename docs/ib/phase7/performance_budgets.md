# Phase 7 Performance Budgets

## Purpose
Task 161 required explicit budgets for the teacher-heavy IB routes and the supporting queue/mutation paths that make the product feel fast or slow in daily use.

## Budget layers
- Product target: what pilot schools should feel in steady-state production.
- E2E guardrail: the looser seeded Playwright threshold that protects against clear regressions in CI and local validation.

## Route budgets
| Route / workflow | Product target | E2E guardrail | Source |
|---|---:|---:|---|
| `/ib/home` teacher action console ready | 2.0s | 12.0s | `performance-budgets.spec.ts`, `TeacherActionConsole` |
| `/ib/evidence` evidence inbox ready | 2.5s | 10.0s | `performance-budgets.spec.ts`, evidence inbox |
| `/ib/families/publishing` queue ready | 2.5s | 10.0s | `performance-budgets.spec.ts`, publishing queue |
| `/ib/operations` operations center ready | 3.0s | 12.0s | `performance-budgets.spec.ts`, operations center |
| command palette open to searchable state | 300ms | 2.0s | `teacher-workflow-benchmark.spec.ts`, command palette |
| mutation confirm for pin/duplicate/autosave | 1.2s | 6.0s | `emitIbEvent`, autosave, duplication endpoints |
| optimistic offline queue flush | 5.0s | 10.0s | mutation queue + conflict handling |

## Current measured state
- Backend benchmark service currently uses seeded proxy durations when no pilot telemetry exists.
- The teacher benchmark rail exposes `within_budget` versus `over_budget` state for planning, evidence review, family publish, specialist contribution, and coordinator approval.
- The new Playwright route harness records ready-time annotations per representative route.

## Loading strategy rules
- Teacher home and operations center may aggregate on the server, but deep workspace panes should stay client-responsible and incremental.
- Avoid duplicate fetches for the same school-scoped IB payload.
- Keep empty, loading, and offline states explicit so speed problems do not masquerade as broken navigation.
- Prefer restoring pinned work, recent history, and command palette search locally before forcing a round-trip.

## Regression response
1. If the Playwright guardrail fails, confirm whether the regression is route load, data hydration, or render cost.
2. Check `IbActivityEvent` latency metadata before widening any guardrail.
3. If production targets are missed but guardrails pass, treat it as a backlog item, not a reason to relax the product target.
4. If the route is hot-path teacher work, fix route/data duplication before adding more UI complexity.

## Files enforcing the budget
- `apps/core/app/services/ib/support/workflow_benchmark_service.rb`
- `apps/core/app/services/ib/support/performance_budget_service.rb`
- `apps/web/e2e/ib/helpers.ts`
- `apps/web/e2e/ib/performance-budgets.spec.ts`
