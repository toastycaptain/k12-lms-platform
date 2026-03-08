# Charter and Foundations

Covers tasks `469-480`.

## What was defined
- Phase charter, success criteria, scope boundaries, and artifact naming are codified in `tests/simulations/ib/foundations/foundations.json`.
- The task pack itself is indexed from `spec/ib-phase11-codex-tasks/` and mirrored into `tests/simulations/ib/tasks/catalog.json`.
- Role taxonomy, academic calendar, school-year cadence, benchmark targets, privacy rules, failure taxonomy, and change-management discipline are all represented in the same machine-readable foundation file.

## Key decisions
- Playwright remains the browser workflow engine.
- k6 remains the load and scale engine.
- The canonical artifact tree is `artifacts/phase11/runs/<runId>/...` with a copied `latest/` view.
- Phase 11 stops at evidence and recommendations; it does not start Phase 12 implementation.

## Concrete outputs by task family
- `469-472`: charter, toolchain, repo structure, naming conventions
- `473-476`: role matrix, calendar model, programme-year model, environment profiles
- `477-480`: privacy guardrails, benchmark SLOs, failure taxonomy, commit discipline

## Files
- `tests/simulations/ib/foundations/foundations.json`
- `tests/simulations/ib/tasks/catalog.json`
- `artifacts/phase11/latest/manifest.json`
- `artifacts/phase11/latest/summaries/task-469.md` through `task-480.md`
