# IB Phase 9 Teacher Speed and Specialist Benchmarks

Covers task range `305` to `316`.

## What shipped
- Benchmark refresh service backed by persisted `IbBenchmarkSnapshot` records.
- Teacher and specialist benchmark panels embedded directly in the daily workflow surfaces.
- Replacement-readiness service now factors benchmark regressions into final closeout guidance.

## Benchmark contract
- Snapshots capture benchmark version, role scope, workflow family, observed metrics, and threshold payloads.
- The UI exposes current regressions and allows new snapshots to be captured from the same surfaces where the work happens.
- Speed status is now reflected in the final readiness summary instead of living in isolated documents.

## Why this matters
- Performance claims are no longer static phase-doc statements.
- Teachers and specialists can see the current state of the speed sprint in-product, and operators can block wider rollout when regressions reappear.

## Remaining explicit gaps
- Benchmark capture still reflects service-level proxies rather than controlled device-lab timing.
- CI gating remains advisory through readiness surfaces; it is not yet enforced as a hard merge or deploy gate.
