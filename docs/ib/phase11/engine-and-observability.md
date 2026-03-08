# Engine and Observability

Covers tasks `493-514`.

## Shared engine
- `tools/simulation/phase11/catalog.mjs` is the source of truth for tasks, roles, scenarios, suites, endpoints, and anomaly injections.
- `tools/simulation/phase11/build-phase11.mjs` materializes the machine-readable catalogs, k6 scripts, and deterministic sample run.
- `tools/simulation/phase11/artifacts.mjs` writes manifests, events, summaries, failure packets, and recommendation bundles.
- `tools/simulation/phase11/audit-phase11.mjs` validates coverage against the repo outputs.

## Browser harness
- `apps/web/e2e/ib/phase11/harness.ts` loads the shared scenario catalog, maps role keys to seeded users, writes structured event logs, and produces a smoke summary.
- `apps/web/e2e/ib/phase11/smoke.spec.ts` executes a role-complete smoke subset instead of duplicating isolated ad hoc E2E tests.
- `apps/web/playwright.config.ts` runs the web app on isolated E2E ports and uses `next build` plus `next start` so simulation runs are not coupled to a stale `next dev` process or local port `3000`.

## Performance and result schemas
- `tests/simulations/ib/schemas/` holds minimal schemas for scenario, suite, and summary artifacts.
- `tests/performance/ib/*.js` contains the four Phase 11 k6 workloads.
- `artifacts/phase11/latest/` shows the required artifact model in concrete form.

## Files
- `tools/simulation/phase11/catalog.mjs`
- `tools/simulation/phase11/build-phase11.mjs`
- `tools/simulation/phase11/artifacts.mjs`
- `tools/simulation/phase11/audit-phase11.mjs`
- `apps/web/e2e/ib/phase11/harness.ts`
- `apps/web/e2e/ib/phase11/smoke.spec.ts`
- `tests/performance/ib/`
- `artifacts/phase11/latest/summaries/task-493.md` through `task-514.md`
