# Task 09 — DP Course Map, Assessment Dashboard, and Internal Assessment Workspaces

## Goal
Create the first half of the DP experience focused on rigorous course planning and assessment readiness.

This task builds:
- `DpCourseMap`
- `DpAssessmentDashboard`
- `InternalAssessmentTracker`

---

## Why this task matters
The roadmap emphasizes that DP teachers and coordinators are often forced into external trackers and spreadsheets.

The frontend should reduce that by giving them:
- a coherent two-year course map
- central internal/external assessment readiness views
- subject-specific IA tracking that is much better than generic assignment pages

---

## Roadmap coverage
This task implements roadmap sections covering:
- `DpCourseMap`
- `DpAssessmentDashboard`
- `InternalAssessmentTracker`
- the first half of Phase 4

---

## Required outcome
After this task:
- DP has a distinct course-planning surface
- assessment windows and IA checkpoints are visible on a timeline/map
- teachers and coordinators can see readiness without juggling spreadsheets

---

## `DpCourseMap` requirements

### Purpose
Provide a two-year course map that shows:
- units/topics
- assessment windows
- IA checkpoints
- revision arcs
- core touchpoints

### Suggested route
- `/ib/planning/dp/courses/[courseId]`
- or `/ib/planning/dp/course-map/[documentId]` depending on your document model

### Required UI characteristics
- timeline or sequenced map, not just a list
- visible term/semester or period grouping if applicable
- quick links into unit or assessment details
- compact summary mode for coordinators

---

## `DpAssessmentDashboard` requirements

### Purpose
Provide a central view of internal and external assessment readiness.

### Required features
- subject-specific milestone trackers
- draft status visualization
- submission readiness
- supervisor/teacher feedback history where relevant
- filtered cohort views

### UX notes
This should feel like a serious operations surface, but not an outdated admin grid.
Use:
- status cards
- trend/status columns
- filterable table/grid where needed
- quick “who needs action next” views

---

## `InternalAssessmentTracker` requirements

### Purpose
Give each DP subject a stronger workflow than generic assignments.

### Required features
- student milestone table or board
- draft history
- authenticity/academic honesty check markers
- annotation feedback summary or entry points
- supervisor meeting log or teacher notes entry points
- evidence/completion status

### Suggested route
- `/ib/assessment/dp/internal-assessments/[subjectOrCourseId]`

---

## Detailed implementation steps

### Step 1 — Build `DpCourseMap`
Create:
- `DpCourseMap.tsx`
- `DpCourseTimeline.tsx`
- `DpCourseUnitCard.tsx`
- `DpAssessmentWindowMarkers.tsx`
- `DpRevisionArcStrip.tsx`

Ensure the map can render even with partial data.
Use sensible empty states for missing milestones or windows.

### Step 2 — Build `DpAssessmentDashboard`
Create:
- `DpAssessmentDashboard.tsx`
- `DpReadinessSummaryCards.tsx`
- `DpAssessmentFilters.tsx`
- `DpAssessmentStatusGrid.tsx`

Support filtering by:
- course/subject
- cohort/group
- readiness state
- milestone type

### Step 3 — Build `InternalAssessmentTracker`
Create:
- `InternalAssessmentTracker.tsx`
- `IaStudentStatusTable.tsx`
- `IaDraftHistoryPanel.tsx`
- `IaFeedbackTrail.tsx`
- `IaMeetingLogPanel.tsx`

Even if some backend fields are still maturing, create a stable structure and adapters.

### Step 4 — Integrate quick actions and context bar
DP screens are high consequence and must always show clear context.

Use the shared `StickyContextBar` to display:
- programme = DP
- course
- cohort or class if applicable
- assessment type or IA status context

### Step 5 — Surface dashboard entry points
Add links from the IB home and the Projects/Core workspace so users can get to DP surfaces quickly.

---

## UX requirements

### Reduce spreadsheet dependence
Do not build these screens as giant unbroken tables only.

Prefer a balance of:
- summary cards
- filterable grids
- timelines
- side drawers for detail

### Make readiness legible
A DP coordinator should be able to answer “who needs attention” almost instantly.

Use clear visual statuses and action-focused sorting/filtering.

### Preserve seriousness without feeling antiquated
DP screens should feel trustworthy, but not old-fashioned or hard to parse.

Avoid:
- dense all-text rows
- tiny click targets
- information hidden behind too many tabs

---

## Files to modify or create
Likely files include:
- `apps/web/src/features/ib/dp/*`
- relevant route entry points under `/ib/planning` and `/ib/assessment`
- dashboard integrations from Task 03

---

## Testing requirements

### Unit/component tests
Add tests for:
- course map rendering
- readiness filters and states
- IA tracker row/detail behaviors
- empty and partial data handling

### E2E scenarios
At minimum:
- DP teacher opens course map and sees units + IA checkpoints
- coordinator filters assessment dashboard by readiness status
- teacher opens IA tracker and inspects student draft history or status

---

## Acceptance criteria
This task is complete only when:
- DP has a distinct course map
- assessment readiness is visible through a dedicated dashboard
- internal assessment tracking is meaningfully better than a generic assignment list

---

## Handoff to Task 10
Task 10 completes the DP experience with:
- CAS workspace
- EE supervision workspace
- TOK workspace
- DP core overview
- family support views
