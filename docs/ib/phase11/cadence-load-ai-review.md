# Cadence, Load, AI, and Review

Covers tasks `596-612`.

## Cadence suites
- `tests/simulations/ib/manifests/suite-catalog.json` defines:
  - daily
  - weekly
  - term
  - annual
  - monte-carlo
- These suites reuse the role scenario IDs instead of redefining flows.

## Load and scale
- `tests/performance/ib/evidence-publishing.js`
- `tests/performance/ib/reporting-search-queue.js`
- `tests/performance/ib/realtime-collaboration.js`
- `tests/performance/ib/large-school-scale.js`
- Endpoint targets for those workloads are recorded in `tests/simulations/ib/load/endpoints.json`.

## UX and recovery
- Friction-oriented suites are part of the suite catalog and focus on click depth, route changes, modal count, and recoveries.
- Competitive parity and recovery tasks feed directly into the recommendation bundle.

## AI and review loop
- Tasks `609-611` are modeled as review-gated AI suites, not autonomous publish paths.
- Task `612` closes the phase with evidence-linked recommendations in:
  - `artifacts/phase11/latest/recommendations/recommendations.json`
  - `artifacts/phase11/latest/recommendations/recommendations.md`

## Files
- `tests/simulations/ib/manifests/suite-catalog.json`
- `tests/simulations/ib/load/endpoints.json`
- `tests/performance/ib/`
- `artifacts/phase11/latest/failure-packets/`
- `artifacts/phase11/latest/recommendations/`
- `artifacts/phase11/latest/summaries/task-596.md` through `task-612.md`
