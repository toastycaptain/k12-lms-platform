# Task 23 — IB STEP6 PYP POI EXHIBITION FRONTEND AND OPERATIONS

## Position in sequence
- **Step:** 6 — Build POI, exhibition, and interdisciplinary planning as first-class systems
- **Run after:** Task 22
- **Run before:** Task 24 moves to MYP interdisciplinary, projects, and service domain work.
- **Primary mode:** Backend + Frontend

## Objective
Bind the PYP Programme of Inquiry board and PYP Exhibition workspace to live data, including POI governance signals, entry drilldowns, and exhibition planning hooks.

## Why this task exists now
This task converts the PYP coordinator-facing strategy surfaces from static IB showcases into live operational pages. It also prepares the later PYP vertical slice to connect a unit directly into POI and exhibition flows.

## Current repo anchors
- Output from Task 22
- `apps/web/src/features/ib/pyp/ProgrammeOfInquiryBoard.tsx`
- `apps/web/src/features/ib/pyp/ProgrammeOfInquiryGrid.tsx`
- `apps/web/src/features/ib/pyp/ProgrammeOfInquiryDrawer.tsx`
- `apps/web/src/features/ib/pyp/PypExhibitionWorkspace.tsx`
- `apps/web/src/app/ib/pyp/*` route files from Step 1

## Scope
- Replace static POI board content with live data, filters, and drawer/detail flows.
- Expose governance signals such as gaps, overlaps, specialist coverage, and review state.
- Bind the exhibition workspace to real records or at least live placeholders from the backend domain if exhibition-specific models are introduced later in this task or already defined in the pack.

## Backend work
- Add exhibition-related backend support if the POI task intentionally left it minimal: exhibition record summary endpoints, milestone placeholders, mentor/group associations if the domain is introduced here.
- Ensure POI APIs return route targets and entity refs needed by the board and drawer.

## Frontend work
- Bind `ProgrammeOfInquiryBoard`, filters, grid, unit cards, and drawer to live endpoints.
- Implement real filter state (theme, year, school, academic year, coverage signal, specialist involvement, review status).
- Bind `PypExhibitionWorkspace` to live exhibition summary data rather than static panels.
- Ensure coordinator drilldown from the board lands on real units, not examples.

## Data contracts, APIs, and model rules
- Use calm summary cards with clear drilldown targets; do not drown coordinators in table density.
- Show provenance and last-updated metadata for POI entries so coordinators trust the board.

## Risks and guardrails
- Do not make the board so visually polished that it hides missing data quality or stale entries.
- Do not show coordinator-only governance hints to teachers/families unless intentionally designed.

## Testing and verification
- Component/integration tests for POI filtering, drawer drilldown, and exhibition summary rendering.
- Regression tests verifying no static arrays remain in the POI board after cutover.

## Feature flags / rollout controls
- Gate with `ib_poi_v1` and optionally `ib_pyp_exhibition_live_v1` if exhibition rollout needs to lag.
- Do not create fake exhibition milestones; use honest empty states if the deeper exhibition domain is not fully live yet.

## Acceptance criteria
- PYP POI and exhibition surfaces are live enough to support coordinator operations.
- The later PYP vertical slice can now link a real unit into a real POI context and an exhibition hook.

## Handoff to the next task
- Task 24 moves to MYP interdisciplinary, projects, and service domain work.
