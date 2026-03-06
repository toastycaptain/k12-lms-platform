# Task 08 — MYP Criteria, ATL, Interdisciplinary Planning, and Projects Hub

## Goal
Complete the MYP workflow by making criterion-based assessment, ATL, interdisciplinary collaboration, and projects/service feel like first-class product surfaces.

This task builds:
- `CriteriaPlannerPanel`
- `ATLProgressionPanel`
- `InterdisciplinaryUnitStudio`
- `ProjectsHub`
- the MYP student learning stream foundations where they directly relate to criteria/projects

---

## Why this task matters
A major weakness in many school systems is that criteria or projects appear only at the grading or compliance stage.

For MYP, the product must make these things visible earlier:
- criteria alignment should be visible during planning
- ATL should feel like real progression, not tags hidden in reports
- interdisciplinary units should not require ugly workarounds
- Personal Project, Community Project, and Service as Action need dedicated workflow support

---

## Roadmap coverage
This task implements roadmap sections covering:
- `CriteriaPlannerPanel`
- `ATLProgressionPanel`
- `InterdisciplinaryUnitStudio`
- `ProjectsHub`
- MYP student experience / `StudentLearningStream` elements relevant to projects and criteria
- remaining Phase 3 deliverables

---

## Required outcome
After this task:
- criterion planning is visible inside the unit workflow
- ATL tracking/progression has dedicated UI
- interdisciplinary planning has a dedicated collaborative surface
- projects and service have a dedicated hub instead of generic assignments

---

## `CriteriaPlannerPanel` requirements

### Purpose
Make criterion-based assessment visible throughout planning.

### Required features
- map criteria to assessment tasks
- show coverage balance across the unit
- show criterion evidence opportunities during learning sequence
- support common task planning where relevant
- display criterion chips/status without forcing the teacher into a gradebook page

### UX notes
Use a planner-style panel rather than a spreadsheet-only table.
Support:
- compact overview
- expanded criterion mapping
- inline links to assessment or evidence sections

---

## `ATLProgressionPanel` requirements

### Purpose
Show ATL emphasis and progression visibly across the unit and beyond.

### Required features
- track ATL categories emphasized in the unit
- show quick summary of overused/underused ATL categories if data is available
- support unit-level tagging and notes
- support later linkage to student evidence and progress

### UX notes
ATL should be easy to understand at a glance.
Use:
- chips
- mini trend visuals if feasible
- compact summary cards

---

## `InterdisciplinaryUnitStudio` requirements

### Purpose
Support real interdisciplinary planning rather than forcing multiple subject groups into disconnected documents.

### Required features
- invite co-planners from multiple subject groups
- compare learning goals side by side
- shared inquiry block
- shared assessment planning
- combined reflection log

### Suggested route
- `/ib/planning/myp/interdisciplinary/[id]`

### UX notes
The UI should make joint planning understandable.
Use:
- split panes or columns for subject-side comparisons
- shared middle sections for common inquiry/assessment
- visible collaborator context

---

## `ProjectsHub` requirements

### Purpose
Provide a dedicated workspace for:
- Personal Project
- Community Project
- Service as Action

### Required features
- milestone templates
- meeting logs
- evidence uploads
- rubric/progress displays
- advisor dashboard
- student reflection timeline

### Suggested route patterns
- `/ib/projects-core/myp/personal-project`
- `/ib/projects-core/myp/community-project`
- `/ib/projects-core/myp/service`

You may unify these under one hub with tabs if that fits the backend model better.

---

## Detailed implementation steps

### Step 1 — Add criteria planning to the MYP unit studio
Create and integrate:
- `CriteriaPlannerPanel.tsx`
- `CriteriaCoverageSummary.tsx`
- `CriteriaTaskMapper.tsx`

Mount the panel inside the unit studio’s assessment tab or as a split view companion.

### Step 2 — Add ATL progression panel
Create and integrate:
- `ATLProgressionPanel.tsx`
- `ATLCategorySummary.tsx`
- `ATLTaggingEditor.tsx`

Keep this panel visible enough that teachers do not forget ATL until reporting time.

### Step 3 — Build interdisciplinary planning route and module
Create:
- `InterdisciplinaryUnitStudio.tsx`
- `InterdisciplinarySharedInquiryPanel.tsx`
- `InterdisciplinaryAssessmentPanel.tsx`
- `InterdisciplinaryReflectionLog.tsx`

Use shared layout primitives from Task 02 to keep multi-planner views readable.

### Step 4 — Build `ProjectsHub`
Create:
- `ProjectsHub.tsx`
- `ProjectMilestoneTimeline.tsx`
- `AdvisorDashboard.tsx`
- `StudentProjectReflectionFeed.tsx`
- `ServiceAsActionPanel.tsx`

### Step 5 — Connect project milestones into student-facing views where relevant
At minimum, expose milestone cards or stream items that later tasks can reuse in the student experience.

---

## Important UX requirements

### Do not bury criteria
Criterion planning must be easy to inspect without opening several nested pages.

### Do not make ATL decorative
ATL should not just be tags buried in a side form. It must be visible in planning and later in progress.

### Avoid spreadsheet-only project UX
Advisors and students need visibility, but not endless dense grids.

Mix:
- timelines
- milestone cards
- filters
- quick status summaries

### Support collaboration directly in the object
Interdisciplinary planning should happen around the shared unit object, not in a generic messages page detached from the work.

---

## Files to modify or create
Likely files include:
- `apps/web/src/features/ib/myp/*`
- MYP unit studio components from Task 07
- `/ib/projects-core/*` route surfaces
- dashboard widgets or student stream hooks where milestone surfacing is useful

---

## Testing requirements

### Unit/component tests
Add tests for:
- criterion mapping UI
- ATL tagging/progression summary
- interdisciplinary planner layout and shared sections
- projects hub milestone rendering

### E2E scenarios
At minimum:
- MYP teacher maps criteria to a task
- teacher adds ATL emphasis and sees it summarized
- co-planners open an interdisciplinary unit and view shared planning areas
- advisor/student view project milestones and reflections

---

## Acceptance criteria
This task is complete only when:
- criteria are visible inside planning, not only grading
- ATL has a dedicated and understandable UI
- interdisciplinary planning has a real surface
- projects/service have a serious hub rather than generic assignment workarounds

---

## Handoff to Task 09
Task 09 starts the DP buildout with course maps and assessment/IA workflows.
