# Task 27 — IB STEP6 DP CORE AND RISK WORKSPACES ON LIVE DATA

## Position in sequence
- **Step:** 6 — Build POI, exhibition, and interdisciplinary planning as first-class systems
- **Run after:** Task 26
- **Run before:** Task 28 now shifts to standards and practices evidence, which must also move from board to system.
- **Primary mode:** Backend + Frontend

## Objective
Bind DP course map, IA dashboards, and core workspaces (CAS, EE, TOK) to live backend data so the DP experience becomes operational, auditable, and risk-aware.

## Why this task exists now
This task turns the DP frontend from a strong concept into a real coordinator/teacher tool. It is still not the later DP vertical slice, but it establishes the operational surfaces that the slice will deepen later.

## Current repo anchors
- Output from Task 26
- `apps/web/src/features/ib/dp/DpCourseMap.tsx`
- `apps/web/src/features/ib/dp/InternalAssessmentTracker.tsx`
- `apps/web/src/features/ib/dp/DpAssessmentDashboard.tsx`
- `apps/web/src/features/ib/dp/CasWorkspace.tsx`
- `apps/web/src/features/ib/dp/EeSupervisionWorkspace.tsx`
- `apps/web/src/features/ib/dp/TokWorkspace.tsx`

## Scope
- Replace static DP dashboards and workspaces with live data and route targets.
- Expose real milestone/risk state and next actions for teachers/coordinators/advisors.
- Preserve the serious operational tone of the DP experience without devolving into forms-only clutter.

## Backend work
- Add any missing summary/detail endpoints for course-map, IA, EE, TOK, or CAS pages if the backend domain created in Task 26 needs more tailored payloads.

## Frontend work
- Bind all DP workspaces to live hooks and backend payloads.
- Ensure every risk card or queue row deep-links to the correct live record.
- Show blocked/missing-review states from real workflow data.

## Data contracts, APIs, and model rules
- Use clear sections for immediate follow-up, not just dense milestone tables.
- Align the visual semantics of “at risk”, “awaiting advisor”, “awaiting student reflection”, etc. with backend reason codes where possible.

## Risks and guardrails
- Do not force coordinators to navigate multiple screens to understand one student or one IA risk; deep links and summaries must stay coherent.

## Testing and verification
- Frontend integration tests for each DP workspace with live mocked payloads.
- Regression tests ensuring no static DP arrays or fake IDs remain in the key operational views.

## Feature flags / rollout controls
- Gate with `ib_dp_core_live_v1` until stable.
- Do not attempt the full student/family DP slice yet; that belongs to the later DP vertical slice pack.

## Acceptance criteria
- DP operational surfaces are now live enough for coordinator oversight and future deepening.

## Handoff to the next task
- Task 28 now shifts to standards and practices evidence, which must also move from board to system.
