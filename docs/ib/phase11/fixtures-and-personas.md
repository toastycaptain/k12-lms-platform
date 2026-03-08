# Fixtures and Personas

Covers tasks `481-492`.

## Deterministic fixture layer
- `tests/simulations/ib/fixtures/fixtures.json` defines minimal, representative, and large school profiles.
- The same fixture file includes programme-specific seed expectations for PYP, MYP, and DP.
- Adult, learner, and guardian personas are encoded with workload style, device mix, cadence preferences, and household patterns.

## Executable seed support
- `apps/core/lib/tasks/e2e_seed.rake` now seeds a broader IB role matrix:
  - coordinator and director
  - MYP and DP teachers
  - CAS advisor, EE supervisor, TOK teacher
  - primary, middle-years, and diploma students
  - multi-child guardian household
- `apps/web/e2e/helpers/seed.ts` and `apps/web/e2e/helpers/auth.ts` expose matching seeded identities for browser simulations.

## Migration and scale fixture coverage
- Toddle- and ManageBac-shaped expectations are stored in `tests/simulations/ib/fixtures/fixtures.json`.
- Search and bulk-volume targets are stored in the same file and consumed by the suite and load manifests.

## Files
- `tests/simulations/ib/fixtures/fixtures.json`
- `apps/core/lib/tasks/e2e_seed.rake`
- `apps/web/e2e/helpers/seed.ts`
- `apps/web/e2e/helpers/auth.ts`
- `artifacts/phase11/latest/summaries/task-481.md` through `task-492.md`
