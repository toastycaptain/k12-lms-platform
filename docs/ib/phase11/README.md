# Phase 11

Phase 11 treats the IB platform as an operating school and validates it through deterministic role-based simulations, cadence suites, load profiles, friction benchmarks, AI review flows, and Codex-readable artifacts.

## Primary outputs
- Foundations and fixture catalogs: `tests/simulations/ib/`
- Load scripts: `tests/performance/ib/`
- Browser smoke harness: `apps/web/e2e/ib/phase11/`
- Sample artifact bundle: `artifacts/phase11/runs/sample-phase11-20260308T000000Z/`
- Latest artifact copy: `artifacts/phase11/latest/`

## Task family mapping
- Tasks `469-480`: [charter-and-foundations.md](./charter-and-foundations.md)
- Tasks `481-492`: [fixtures-and-personas.md](./fixtures-and-personas.md)
- Tasks `493-514`: [engine-and-observability.md](./engine-and-observability.md)
- Tasks `515-595`: [role-scenarios.md](./role-scenarios.md)
- Tasks `596-612`: [cadence-load-ai-review.md](./cadence-load-ai-review.md)
- Task `613`: [coverage-audit.md](./coverage-audit.md)

## Commands
- Rebuild catalogs and the deterministic sample bundle:
  - `node tools/simulation/phase11/build-phase11.mjs`
- Audit the Phase 11 pack:
  - `node tools/simulation/phase11/audit-phase11.mjs`
- Run Phase 11 node-level validation:
  - `node --test tools/simulation/phase11/*.test.mjs`
- Run the Playwright smoke subset:
  - `cd apps/web && npm run e2e:phase11:smoke`

## Playwright runtime notes
- The Playwright harness defaults to isolated ports `3200` for web and `4200` for core to avoid colliding with ad hoc local dev sessions.
- The web server boots through `next build` plus `next start` so the simulation suite does not depend on a reused `next dev` process.
- Local production-mode proxying sets `ALLOW_INSECURE_CORE_URL=true` so the web app can safely proxy to a local HTTP core during simulation runs.

## Review discipline
- `tests/simulations/ib/tasks/catalog.json` is the machine-readable task index.
- `artifacts/phase11/latest/summaries/task-<id>.md` gives a task-local summary for every task from `469` through `612`.
- `artifacts/phase11/latest/recommendations/` contains the recommendation bundle that closes the phase.
