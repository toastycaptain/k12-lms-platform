# Task 10 — DP Core: CAS, EE, TOK, Core Overview, and Family Support View

## Goal
Complete the DP experience by building dedicated workspaces for the DP core and a family-friendly support view.

This task builds:
- `CasWorkspace`
- `EeSupervisionWorkspace`
- `TokWorkspace`
- `DpCoreOverview`
- family-facing DP support summaries

---

## Why this task matters
The roadmap is explicit: DP should feel rigorous, trackable, and less spreadsheet-dependent.

That is especially true for core components where schools often rely on fragmented trackers.

The frontend must reduce the operational burden for:
- coordinators
- supervisors/advisors
- students
- families supporting students at home

---

## Roadmap coverage
This task implements roadmap sections covering:
- `CasWorkspace`
- `EeSupervisionWorkspace`
- `TokWorkspace`
- `DpCoreOverview`
- DP family view and support summaries
- remaining Phase 4 deliverables

---

## Required outcome
After this task:
- CAS has its own useful workflow surface
- EE supervision is centralized and easier to manage
- TOK work has a dedicated planning/review area
- coordinators and students can see one combined view of core progress
- families get a support-oriented view, not raw compliance clutter

---

## `CasWorkspace` requirements

### Purpose
Make CAS useful rather than bureaucratic.

### Required features
- experiences and projects timeline
- evidence + reflection capture
- advisor comments
- completion dashboard
- status chips for authenticity, reflection quality, advisor follow-up
- student-friendly progress signals

### Suggested route
- `/ib/projects-core/dp/cas`

### UX notes
This should feel like an active progress workspace, not a compliance ledger.

---

## `EeSupervisionWorkspace` requirements

### Purpose
Reduce advisor spreadsheet load and make supervision workflows visible.

### Required features
- student list by supervisor
- meeting log support in the style expected by the programme
- milestone tracker
- draft comparisons
- source/research note storage or entry points
- one-click student status overview

### Suggested route
- `/ib/projects-core/dp/ee`

### UX notes
Support both:
- advisor overview
- individual student detail view

---

## `TokWorkspace` requirements

### Purpose
Support TOK planning/review workflows.

### Required features
- prompts / object selection / evidence links
- teacher checkpoints
- feedback trail
- exemplars and rubric references where available

### Suggested route
- `/ib/projects-core/dp/tok`

---

## `DpCoreOverview` requirements

### Purpose
Provide one place where coordinators and students can see CAS + EE + TOK progress together.

### Required features
- high-level progress summary across core strands
- upcoming deadlines
- “needs action” grouping
- ability to jump into each core workspace quickly

### Suggested route
- `/ib/projects-core/dp`

---

## DP family support view requirements

### Purpose
Families should not receive raw internal tracking screens.
Instead, they should get a structured support-oriented view.

### Required contents
- progress summaries
- important upcoming deadlines
- where support is appropriate
- what is missing from core requirements
- what is complete

### UX rules
- do not expose internal supervisor notes unless explicitly appropriate
- keep language understandable
- avoid compliance clutter and status overload

---

## Detailed implementation steps

### Step 1 — Build the DP projects/core route shell
Create or expand `/ib/projects-core` so DP users can navigate among:
- CAS
- EE
- TOK
- combined overview

### Step 2 — Build `CasWorkspace`
Create:
- `CasWorkspace.tsx`
- `CasTimeline.tsx`
- `CasReflectionComposer.tsx`
- `CasAdvisorCommentPanel.tsx`
- `CasProgressSummary.tsx`

Tie into the portfolio/evidence foundation from Task 04 wherever possible.

### Step 3 — Build `EeSupervisionWorkspace`
Create:
- `EeSupervisionWorkspace.tsx`
- `EeSupervisorStudentList.tsx`
- `EeMeetingLogPanel.tsx`
- `EeDraftCompareView.tsx`
- `EeMilestoneTracker.tsx`

Use `SplitPane` and `DiffViewer` from Task 02 where appropriate.

### Step 4 — Build `TokWorkspace`
Create:
- `TokWorkspace.tsx`
- `TokPromptPanel.tsx`
- `TokCheckpointTimeline.tsx`
- `TokFeedbackTrail.tsx`

### Step 5 — Build `DpCoreOverview`
Create:
- `DpCoreOverview.tsx`
- `DpCoreSummaryCards.tsx`
- `DpCoreDeadlinePanel.tsx`
- `DpCoreNeedsAttentionList.tsx`

### Step 6 — Add family-support view modules
Create family-facing components such as:
- `DpFamilySupportSummary.tsx`
- `DpFamilyUpcomingDeadlines.tsx`
- `DpFamilyActionableSupportCard.tsx`

Mount them later in guardian routes in Task 12, but implement the reusable modules now.

---

## Important UX requirements

### Make core progress understandable at a glance
A student and coordinator should be able to understand status without reading many pages.

### Keep advisor/supervisor workflows efficient
Common tasks should avoid repetitive clicking.
Examples:
- open next student needing follow-up
- log a meeting
- compare drafts
- review outstanding reflections

### Keep the family view supportive, not bureaucratic
Families need clarity and support prompts, not internal audit screens.

---

## Files to modify or create
Likely files include:
- `apps/web/src/features/ib/dp/*`
- `/ib/projects-core/*` route files
- optional dashboard and quick-action integrations

---

## Testing requirements

### Unit/component tests
Add tests for:
- CAS progress and reflection display
- EE student list + detail transitions
- TOK workspace state rendering
- core overview summary cards
- family support summary rendering

### E2E scenarios
At minimum:
- student logs or views CAS evidence
- advisor opens EE workspace and reviews a student
- teacher opens TOK workspace and sees checkpoints/feedback
- coordinator opens DP core overview and identifies items needing attention

---

## Acceptance criteria
This task is complete only when:
- DP core has dedicated workspaces
- CAS/EE/TOK are no longer implied or buried in generic pages
- core overview unifies progress meaningfully
- family support modules exist and present a support-oriented perspective

---

## Handoff to Task 11
Task 11 will upgrade the student-facing experience and progress model across the IB continuum.
