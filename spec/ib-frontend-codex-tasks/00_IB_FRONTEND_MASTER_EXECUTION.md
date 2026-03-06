# IB Frontend Modernization — Master Execution Plan for Codex

## Purpose
This folder converts the full **IB frontend roadmap** for `k12-lms-platform` into a set of **sequential, Codex-ready implementation tasks**.

These tasks assume the **modular curriculum backend work is complete or sufficiently stable**:
- runtime-selectable curriculum packs
- schema-driven curriculum documents
- planning contexts
- pack-bound workflows
- school scoping
- generic framework search

The goal is to make the frontend feel **truly native to an IB school** across:
- **PYP**
- **MYP**
- **DP**
- coordinator/admin/family/student roles

This is **not** a generic LMS polish pass. It is an **IB mode product buildout**.

---

## Non-negotiable product goals
The implementation sequence below must preserve these goals:

1. The product must feel like an **IB workspace system**, not a generic LMS with renamed labels.
2. The app must become **easier to use than Toddle and ManageBac** for daily teacher work.
3. Common teacher actions must be optimized for **low click count, low ambiguity, and clear context**.
4. Family views must be **understandable, permissioned, and calm**, not jargon-heavy or spammy.
5. Portfolio/evidence must become a **first-class product surface**, not a sidecar.
6. MYP and DP must receive **serious workflow support**, not just generic assignment pages.
7. The frontend must remain **performant, mobile-capable, and accessible** as complexity increases.

---

## What this sequence covers from the roadmap
This task set fully covers the roadmap sections on:
- strengths and current gaps in the repo
- IB-native information architecture
- PYP buildout
- MYP buildout
- DP buildout
- portfolio/evidence/family experiences
- cross-programme coordinator surfaces
- AI assistance redesign
- interaction rules and UX constraints
- architecture changes in `apps/web` and `packages/ui`
- exact file-level next steps
- phase-based build order
- testing, performance, and release gates

Nothing from the roadmap should be treated as optional unless a task explicitly marks it as a later-phase enhancement.

---

## Sequential task order
Codex should execute these files **in order**:

1. `01_IB_APP_SHELL_NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
2. `02_IB_UX_FOUNDATIONS_AND_UI_KIT.md`
3. `03_IB_HOME_DASHBOARD_AND_UNIFIED_TIMELINE.md`
4. `04_IB_PORTFOLIO_EVIDENCE_AND_LEARNING_STORIES.md`
5. `05_IB_PYP_PROGRAMME_OF_INQUIRY_AND_UNIT_STUDIO.md`
6. `06_IB_PYP_WEEKLY_FLOW_ACTION_EXHIBITION_AND_FAMILY_WINDOW.md`
7. `07_IB_MYP_UNIT_STUDIO_AND_CONCEPT_CONTEXT.md`
8. `08_IB_MYP_CRITERIA_ATL_INTERDISCIPLINARY_AND_PROJECTS.md`
9. `09_IB_DP_COURSE_MAP_AND_ASSESSMENT_WORKSPACES.md`
10. `10_IB_DP_CORE_CAS_EE_TOK_AND_FAMILY_SUPPORT.md`
11. `11_IB_STUDENT_EXPERIENCE_AND_PROGRESS.md`
12. `12_IB_GUARDIAN_EXPERIENCE.md`
13. `13_IB_CONTINUUM_STANDARDS_PRACTICES_AND_COLLABORATION.md`
14. `14_IB_AI_FIELD_AWARE_ASSISTANCE.md`
15. `15_IB_PERFORMANCE_MOBILE_ACCESSIBILITY_TESTING_AND_RELEASE.md`

Do **not** skip ahead unless a blocking issue in the codebase forces a reorder.

---

## Strict execution rules for Codex

### Rule 1 — Preserve generic curriculum compatibility
IB mode must be implemented in a way that does **not break**:
- American mode
- British mode
- district/school admin surfaces already in the product

Prefer:
- runtime composition
- curriculum feature flags
- module registries
- mode-aware route wrappers

Avoid:
- hard-coding IB assumptions into generic shared code unless the code is truly reusable.

### Rule 2 — Favor additive architecture, then migrate pages
Do not rewrite the whole app in one pass.

Preferred pattern:
1. add shared runtime-aware primitives
2. add IB feature modules under `apps/web/src/features/ib/`
3. switch routes to the new modules
4. retain compatibility wrappers for existing generic routes where needed

### Rule 3 — Keep route stability where possible
Existing URLs that users or tests may already rely on should continue working when practical.

Examples:
- `/dashboard`
- `/plan/units/[id]`
- `/learn/portfolio`
- `/guardian/dashboard`

New IB-native routes may be added, but existing routes should redirect or compose the new modules instead of breaking.

### Rule 4 — Implement the UX rules from the roadmap everywhere
These are product rules, not suggestions:
1. one primary CTA per screen
2. no screen exposes every possible control at once
3. important context is sticky
4. all lists are filterable and saveable
5. planner surfaces must support compact and rich modes
6. every task/evidence item shows context inline
7. all edit surfaces autosave and show status
8. compared objects support split view or new tab
9. AI never applies invisibly
10. family notifications are tiered, not noisy

### Rule 5 — Prefer modern frontend ergonomics over “feature dumping”
The roadmap explicitly aims to outperform Toddle/ManageBac on:
- click depth
- clarity of information architecture
- page heaviness
- mobile parity
- fragmented workflow
- family overload

When in doubt, choose the implementation that:
- reduces click count
- preserves context
- lowers cognitive load
- avoids giant forms

---

## Target architecture after all tasks

### `apps/web/src/features/`
Codex should introduce and grow this structure:

```text
apps/web/src/features/
  curriculum/
    runtime/
    navigation/
    schema/
    documents/
    contexts/
    workflows/
    frameworks/
    timeline/
    evidence/
    family/
    analytics/
  ib/
    shell/
    home/
    shared/
    pyp/
    myp/
    dp/
    portfolio/
    guardian/
    student/
    coordinator/
```

### `packages/ui`
Codex should expand the design system with modern curriculum-workflow components, including:
- tabs
- segmented control
- drawer
- split pane
- tree view
- command palette
- filter bar
- tag input
- chip group
- activity timeline
- comment thread
- diff viewer
- docked inspector
- metric card
- kanban board
- calendar timeline
- virtual data grid
- rich text composer
- presence stack
- autosave indicator

---

## Current repo touchpoints to preserve and evolve
Codex should use these existing files as starting points instead of ignoring them:

### Shell / navigation
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/TopRightQuickActions.tsx`
- `apps/web/src/components/SchoolSelector.tsx`
- `apps/web/src/app/layout.tsx`

### Planning routes
- `apps/web/src/app/plan/units/new/page.tsx`
- `apps/web/src/app/plan/units/[id]/page.tsx`
- `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx`
- `apps/web/src/app/plan/layout.tsx`

### Student / guardian / portfolio
- `apps/web/src/app/learn/dashboard/page.tsx`
- `apps/web/src/app/learn/portfolio/page.tsx`
- `apps/web/src/app/learn/progress/page.tsx`
- `apps/web/src/components/StudentProgressView.tsx`
- `apps/web/src/app/guardian/dashboard/page.tsx`
- `apps/web/src/app/guardian/students/[studentId]/page.tsx`

### AI assistance
- `apps/web/src/components/AiAssistantPanel.tsx`
- `apps/web/src/components/AiApplyModal.tsx`
- `apps/web/src/lib/ai-output-parser.ts`

### Shared infra
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/swr.ts`
- `apps/web/src/hooks/*`
- `packages/ui/src/*`

---

## Deliverable expectations for every task file
Each numbered task should be implemented with all of the following:
- concrete file creation/modification guidance
- route-level and component-level goals
- state/empty/error/loading behavior
- role differences
- testing requirements
- acceptance criteria
- handoff guidance to the next task

If Codex cannot complete every part in one pass, it should still land:
1. architecture scaffolding
2. production-safe partial UI
3. tests for implemented portions
4. TODOs only where genuinely blocked by missing backend contract details

---

## Definition of done for the entire IB buildout
The full sequence is complete only when all of the following are true:
- the shell presents an IB-native workspace system
- PYP, MYP, and DP each have dedicated, native-feeling planning surfaces
- portfolio/evidence is a first-class flow across teacher, student, family, and coordinator views
- guardian views translate learning into family-friendly language
- student progress uses IB-relevant signals, not only averages/mastery
- AI assistance is schema-aware and field-safe
- core daily tasks are usable on mobile/tablet
- performance budgets are enforced on the heaviest routes
- a11y and dark mode are production quality
- the app demonstrably avoids major Toddle/ManageBac pain patterns

---

## Final instruction to Codex
Do not treat these tasks as design notes.
Treat them as **implementation work orders**.

Each task should leave the codebase in a stable state that could be reviewed, tested, and used as the base for the next task.
