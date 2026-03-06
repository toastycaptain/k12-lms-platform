# Task 25 — IB STEP6 MYP INTERDISCIPLINARY PROJECT SERVICE FRONTEND

## Position in sequence
- **Step:** 6 — Build POI, exhibition, and interdisciplinary planning as first-class systems
- **Run after:** Task 24
- **Run before:** Task 26 shifts to DP IA/EE/TOK/CAS domain support.
- **Primary mode:** Backend + Frontend

## Objective
Bind the MYP interdisciplinary studio and projects hub to live backend data, preserving MYP-specific workflow clarity while using the new domain objects and pack-defined schemas.

## Why this task exists now
This task operationalizes the MYP-specific surfaces that were previously designed but not yet tied to real records. It is still not the full MYP vertical slice—that comes later in a separate pack.

## Current repo anchors
- Output from Task 24
- `apps/web/src/features/ib/myp/InterdisciplinaryUnitStudio.tsx`
- `apps/web/src/features/ib/myp/ProjectsHub.tsx`
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- `apps/web/src/app/ib/myp/*` routes from Step 1

## Scope
- Bind interdisciplinary and project/service views to live queries and detail records.
- Show real milestone state, advisor follow-up, and cross-linking between subject units and interdisciplinary work.
- Preserve the MYP-specific language of criteria, ATL, contexts, and inquiry while using live data models.

## Backend work
- Add any missing summary/detail endpoints for project hubs or interdisciplinary dashboards if the backend domain created in Task 24 needs more tailored payloads.

## Frontend work
- Replace static project cards and interdisciplinary placeholders with live data.
- Ensure drilldowns land on real project or interdisciplinary records.
- Render incomplete/at-risk states honestly from the backend payload.

## Data contracts, APIs, and model rules
- Keep visual density manageable; MYP operational screens should remain navigable and not collapse into spreadsheet-like clutter.

## Risks and guardrails
- Do not make interdisciplinary planning feel like a second-class appendix to subject units; route and UI importance should reflect its value.

## Testing and verification
- Frontend integration tests for live interdisciplinary/project/service data.
- Verify routes and permissions across teacher/coordinator/student views where exposed.

## Feature flags / rollout controls
- Gate with the same flags as Task 24.
- Do not over-polish student-facing project screens yet if deeper student vertical work is deferred.

## Acceptance criteria
- MYP interdisciplinary and project/service surfaces are now live enough to support coordinator operations and future vertical-slice work.

## Handoff to the next task
- Task 26 shifts to DP IA/EE/TOK/CAS domain support.
