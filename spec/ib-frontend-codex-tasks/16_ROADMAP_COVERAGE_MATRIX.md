# Roadmap Coverage Matrix — IB Frontend Codex Tasks

## Purpose
This file maps the original `ib-frontend-roadmap-k12-lms-platform.md` sections to the sequential task files in this folder.

It exists to ensure **no roadmap detail is lost** during task execution.

---

## Coverage by roadmap section

### Section 1 — What the current repo snapshot already has
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- `01_IB_APP_SHELL_NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`

Includes:
- AppShell runtime terminology/nav awareness
- unit creation flow awareness
- admin curriculum profiles surface
- contracts/profile-pack relevance

### Section 2 — What the current repo snapshot is missing for a serious IB implementation
Covered by:
- `01_IB_APP_SHELL_NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
- `04_IB_PORTFOLIO_EVIDENCE_AND_LEARNING_STORIES.md`
- `05_IB_PYP_PROGRAMME_OF_INQUIRY_AND_UNIT_STUDIO.md`
- `07_IB_MYP_UNIT_STUDIO_AND_CONCEPT_CONTEXT.md`
- `09_IB_DP_COURSE_MAP_AND_ASSESSMENT_WORKSPACES.md`
- `11_IB_STUDENT_EXPERIENCE_AND_PROGRESS.md`
- `12_IB_GUARDIAN_EXPERIENCE.md`
- `14_IB_AI_FIELD_AWARE_ASSISTANCE.md`

Sub-gap mapping:
- generic nav → Task 01
- hard-coded unit editor → Tasks 05 / 07 / 09
- generic lesson editor → Tasks 05 / 06 / 07 / 09
- new unit flow not persisting IB context → Tasks 05 / 07 / 09
- AI heading parsing → Task 14
- standards/grades-centric student progress → Task 11
- portfolio placeholder → Task 04
- guardian too generic → Task 12
- design system too shallow → Task 02
- no dedicated IB programme workspaces → Tasks 05–10 and 13

### Section 3 — What a great IB frontend needs to feel like
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- all task files, especially `01`, `03`, `04`, `11`, `12`, `13`

### Section 4 — Product lessons to borrow / avoid from Toddle and ManageBac
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- `02_IB_UX_FOUNDATIONS_AND_UI_KIT.md`
- `03_IB_HOME_DASHBOARD_AND_UNIFIED_TIMELINE.md`
- `15_IB_PERFORMANCE_MOBILE_ACCESSIBILITY_TESTING_AND_RELEASE.md`

Pain points explicitly addressed:
- too many clicks
- unclear information architecture
- slow/heavy pages
- weak mobile parity
- fragmented workflow
- family overload
- AI noise

### Section 5 — Frontend north star for IB mode
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- `01_IB_APP_SHELL_NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
- `03_IB_HOME_DASHBOARD_AND_UNIFIED_TIMELINE.md`
- `13_IB_CONTINUUM_STANDARDS_PRACTICES_AND_COLLABORATION.md`

### Section 6 — Proposed IB information architecture
Covered by:
- `01_IB_APP_SHELL_NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
- `11_IB_STUDENT_EXPERIENCE_AND_PROGRESS.md`
- `12_IB_GUARDIAN_EXPERIENCE.md`

Includes teacher/coordinator nav, student nav, guardian nav, and route mapping.

### Section 7 — PYP frontend buildout
Covered by:
- `05_IB_PYP_PROGRAMME_OF_INQUIRY_AND_UNIT_STUDIO.md`
- `06_IB_PYP_WEEKLY_FLOW_ACTION_EXHIBITION_AND_FAMILY_WINDOW.md`
- `04_IB_PORTFOLIO_EVIDENCE_AND_LEARNING_STORIES.md`

### Section 8 — MYP frontend buildout
Covered by:
- `07_IB_MYP_UNIT_STUDIO_AND_CONCEPT_CONTEXT.md`
- `08_IB_MYP_CRITERIA_ATL_INTERDISCIPLINARY_AND_PROJECTS.md`
- `11_IB_STUDENT_EXPERIENCE_AND_PROGRESS.md`

### Section 9 — DP frontend buildout
Covered by:
- `09_IB_DP_COURSE_MAP_AND_ASSESSMENT_WORKSPACES.md`
- `10_IB_DP_CORE_CAS_EE_TOK_AND_FAMILY_SUPPORT.md`
- `12_IB_GUARDIAN_EXPERIENCE.md`

### Section 10 — Cross-programme IB surfaces
Covered by:
- `13_IB_CONTINUUM_STANDARDS_PRACTICES_AND_COLLABORATION.md`
- `03_IB_HOME_DASHBOARD_AND_UNIFIED_TIMELINE.md`
- `04_IB_PORTFOLIO_EVIDENCE_AND_LEARNING_STORIES.md`

Includes ContinuumMap, StandardsAndPracticesBoard, CollaborationHub.

### Section 11 — UX patterns that specifically fix Toddle/ManageBac pain points
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- `02_IB_UX_FOUNDATIONS_AND_UI_KIT.md`
- `03_IB_HOME_DASHBOARD_AND_UNIFIED_TIMELINE.md`
- `14_IB_AI_FIELD_AWARE_ASSISTANCE.md`
- `15_IB_PERFORMANCE_MOBILE_ACCESSIBILITY_TESTING_AND_RELEASE.md`

Includes:
- reduce clicks
- sticky context bar
- open-in-new-tab / split-view
- real bulk actions foundations
- unified timelines
- dark mode / accessibility
- autosave/version transparency
- bounded field-aware AI

### Section 12 — Frontend architecture changes needed to support IB deeply
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- `01_IB_APP_SHELL_NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
- `02_IB_UX_FOUNDATIONS_AND_UI_KIT.md`
- all later tasks through feature module creation

Includes:
- `apps/web/src/features/curriculum/`
- `apps/web/src/features/ib/`
- page-level hardcoding to workspace composition
- richer `packages/ui`
- reducing heavy client pages

### Section 13 — Exact file-level next steps in the current repo
Covered throughout, especially:
- `01_IB_APP_SHELL_NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
- `05_IB_PYP_PROGRAMME_OF_INQUIRY_AND_UNIT_STUDIO.md`
- `11_IB_STUDENT_EXPERIENCE_AND_PROGRESS.md`
- `12_IB_GUARDIAN_EXPERIENCE.md`
- `14_IB_AI_FIELD_AWARE_ASSISTANCE.md`

Specific file targets from the roadmap are explicitly called out in those tasks.

### Section 14 — Detailed build sequence
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- the numbering/order of tasks 01–15

### Section 15 — Interaction rules to keep the frontend modern but convenient
Covered by:
- `00_IB_FRONTEND_MASTER_EXECUTION.md`
- reinforced in `02`, `03`, `04`, `05`, `07`, `12`, `14`, and `15`

### Section 16 — Testing strategy for the IB frontend buildout
Covered by:
- test sections inside every task
- especially `15_IB_PERFORMANCE_MOBILE_ACCESSIBILITY_TESTING_AND_RELEASE.md`

### Section 17 — Most important immediate next steps
Covered by task order:
1. shell refactor → Task 01
2. create `features/ib` → Tasks 00–01
3. programme-aware planner router → Task 05
4. `PypUnitStudio` first → Task 05
5. real portfolio → Task 04
6. `LearningStoryComposer` + family window → Tasks 04 and 06
7. dark mode and density → Task 02
8. field-aware AI → Task 14
9. unified teacher dashboard/timeline → Task 03
10. click depth/page latency instrumentation → Tasks 03 and 15

### Section 18 — Final recommendation
Covered holistically by the whole task set.

---

## Important note for Codex
If a task implementation seems to leave out a roadmap point, consult this matrix and fold the missing requirement into the nearest relevant task rather than dropping it.
