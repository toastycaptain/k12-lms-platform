# Role Scenarios

Covers tasks `515-595`.

## Catalog structure
- `tests/simulations/ib/scenarios/catalog.json` holds `81` role-task scenario definitions.
- Each scenario includes:
  - `taskId`
  - `scenarioId`
  - `roleKey`
  - `programmeKey`
  - cadence hint
  - canonical route path
  - page heading
  - assertion keywords
  - friction budget metadata

## Coverage by role family
- `515-522`: PYP homeroom
- `523-529`: PYP specialist
- `530-535`: PYP coordinator
- `536-543`: MYP subject teacher
- `544-549`: MYP coordinator
- `550-557`: DP subject teacher
- `558-563`: DP coordinator
- `564-567`: CAS advisor
- `568-571`: EE supervisor
- `572-575`: TOK teacher
- `576-581`: IB director
- `582-589`: student journeys
- `590-595`: guardian journeys

## Executable browser proof
- The Playwright smoke subset covers every major role with shared runner logic rather than one-off specs.
- Real seeded identities are used through the expanded E2E seed task and auth helpers.

## Files
- `tests/simulations/ib/scenarios/catalog.json`
- `apps/web/e2e/ib/phase11/smoke.spec.ts`
- `artifacts/phase11/latest/summary.json`
- `artifacts/phase11/latest/summaries/task-515.md` through `task-595.md`
