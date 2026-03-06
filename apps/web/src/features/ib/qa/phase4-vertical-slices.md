# IB Phase 4 Slice Architecture

## Step 10 — MYP

- Canonical MYP routes now cover units, interdisciplinary planning, projects, service, coverage, review, and student-safe project drilldowns.
- `CurriculumDocument` remains the source of truth for MYP units and interdisciplinary planning.
- `IbOperationalRecord` carries milestone-heavy project and service workflows so advisor/coordinator/student views share the same state.
- MYP unit routes launch interdisciplinary, project, and service records directly from the live document context.

## Step 11 — DP

- Canonical DP routes now cover course maps, IA detail, EE detail, TOK detail, CAS overview/detail, coordinator oversight, and student overviews.
- `CurriculumDocument` remains the source of truth for course maps.
- `IbOperationalRecord` carries IA, EE, TOK, and CAS workflow state, checkpoints, and risk.
- Course-map routes launch IA/core records directly from the teaching workspace.

## Shared guardrails kept in this slice

- No new IB-only persistence model was invented for data the existing document or operational-record substrate already handles.
- Every primary action lands on a live route, not a dead-end overview.
- Student and guardian surfaces consume filtered backend-derived state instead of frontend-only pseudo-progress.
