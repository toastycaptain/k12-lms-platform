# Task 05 — PYP Programme of Inquiry Board and PYP Unit Studio

## Goal
Build the first truly programme-native IB planning surfaces:
- a **Programme of Inquiry board**
- a **PYP unit studio**

This task should make PYP schools immediately feel “this product was built for us.”

---

## Why PYP comes first
The roadmap explicitly recommended building PYP first because it is the fastest route to obvious IB fit.

PYP schools need a first-class way to work with:
- the Programme of Inquiry
- transdisciplinary themes
- central idea
- lines of inquiry
- learner profile
- ATL
- action
- family visibility

These concepts do not fit naturally into a generic unit/lesson editor.

---

## Roadmap coverage
This task implements roadmap sections covering:
- `ProgrammeOfInquiryBoard`
- `PypUnitStudio`
- PYP must feel transdisciplinary, not subject-first
- PYP family experience foundations where tied to the unit studio
- replacing the generic unit planner with a programme-aware router
- Phase 2 deliverables: POI board and PYP unit studio

---

## Existing repo touchpoints
Current files to replace or adapt:
- `apps/web/src/app/plan/units/[id]/page.tsx`
- `apps/web/src/app/plan/units/new/page.tsx`
- `apps/web/src/components/AppShell.tsx` (already updated earlier)

New modules should live under:
- `apps/web/src/features/ib/pyp/*`
- `apps/web/src/features/curriculum/documents/*`

---

## Required outcome
After this task:
- PYP has a dedicated Programme of Inquiry board route and module
- generic unit editing is replaced by a PYP-aware router when the document/programme is PYP
- PYP unit planning has the correct field groups and mental model
- the UI feels transdisciplinary and schoolwide, not just subject/course centric

---

## Programme of Inquiry board requirements

### Purpose
The POI board should provide a school/grade-wide map showing units across the six transdisciplinary themes.

### Core capabilities
- year-row / theme-column grid
- unit tiles in each grid cell
- hover or click opens a summary drawer
- compare-years view
- printable/export-friendly view
- filter by learner profile, concepts, ATL, action
- optional specialist overlay to show PE/music/library/etc. contributions

### Suggested route
- `/ib/continuum/pyp-poi`

### Components to build
- `ProgrammeOfInquiryBoard.tsx`
- `ProgrammeOfInquiryGrid.tsx`
- `ProgrammeOfInquiryUnitCard.tsx`
- `ProgrammeOfInquiryDrawer.tsx`
- `ProgrammeOfInquiryFilters.tsx`

### Data expectations
The board should consume planning contexts/documents from the completed backend.

If the backend exposes a PYP-specific POI endpoint, use it.
Otherwise, compose the view from:
- planning contexts of PYP/grade-team/programme type
- curriculum documents marked as PYP units with transdisciplinary theme metadata

Keep the adapter logic isolated.

---

## PYP Unit Studio requirements

### Purpose
Replace the generic unit page with a PYP-native unit builder.

### Suggested route patterns
- canonical editor route: `/ib/planning/pyp/units/[id]`
- compatibility route: `/plan/units/[id]` should mount the correct PYP editor when the active document is a PYP unit

### Tabs to implement
- Overview
- Inquiry
- Learning Experiences
- Assessment & Evidence
- Reflection
- Family Window

### Core fields to present clearly
- transdisciplinary theme
- central idea
- lines of inquiry
- key/related concepts if the school uses them
- learner profile focus
- ATL focus
- prior knowledge
- provocations / tuning in
- action opportunities
- reflection prompts
- home-school connection prompt

### Important UX principle
Do not render this as one long form.

Use:
- tabbed sections
- grouped cards
- inline helper language
- sticky context bar
- autosave indicator
- right-side inspector or drawer where useful

---

## Detailed implementation steps

### Step 1 — Create a programme-aware planner router
Introduce a router component such as:
- `IbUnitPlannerRouter.tsx`

Its job:
- inspect document type / programme metadata
- choose `PypUnitStudio`, `MypUnitStudio`, or `DpUnitStudio`
- preserve legacy routes while using the new module structure

Do not keep the current generic `plan/units/[id]/page.tsx` as the long-term implementation.

### Step 2 — Build the POI board module
Implement the grid with:
- clear year rows
- clear theme columns
- empty states when a cell has no unit
- drawer details that do not yank the user away from the board

The summary drawer should show:
- unit title
- central idea preview
- unit timing
- contributing teachers/specialists if available
- learner profile / ATL chips
- action indicators if available
- open full unit action

### Step 3 — Build the PYP Unit Studio shell
Create a top-level shell that includes:
- sticky context bar
- tab navigation
- autosave state
- version/status indicator
- collaborator presence placeholder if available

### Step 4 — Build each tab as a subcomponent
Do not place all tab content in one file.

Recommended structure:
- `PypUnitStudio.tsx`
- `PypUnitOverviewTab.tsx`
- `PypUnitInquiryTab.tsx`
- `PypUnitLearningExperiencesTab.tsx`
- `PypUnitAssessmentEvidenceTab.tsx`
- `PypUnitReflectionTab.tsx`
- `PypUnitFamilyWindowTab.tsx`

### Step 5 — Upgrade the “new unit” flow for PYP
Refactor `apps/web/src/app/plan/units/new/page.tsx` so the wizard supports:
- choose programme and planning context first
- choose “PYP unit of inquiry” as an object type
- persist the correct programme/context/object information in the create flow

Do not continue posting only title/course/status.

### Step 6 — Add family-window preview inside the studio
The Family Window tab should preview the family-facing summary of the unit.

At minimum include:
- what we are exploring
- central idea in family-friendly language
- key questions families can ask at home
- learner profile this month / this unit
- latest learning story links if available later

This tab does not replace the later guardian experience, but it creates the authoring surface.

---

## Specific UX requirements for PYP

### Make it transdisciplinary, not subject-first
The studio should visually emphasize:
- theme
- central idea
- inquiry
- shared learning arc

Do not default the page to a subject/course framing if the current object is a PYP unit.

### Reduce blank-page anxiety
Many PYP fields are conceptually demanding. The UI should help rather than intimidate.

Use:
- placeholder examples
- helper text
- optional structured prompts
- compact cards for completed fields

### Support specialist contributions
The POI board and unit studio should be able to show or accommodate contributions from specialist teachers.

Even if the full collaboration tools land later, the UI should not assume a single homeroom teacher owns the entire plan.

---

## Files to modify or create
Likely files include:
- `apps/web/src/app/plan/units/[id]/page.tsx`
- `apps/web/src/app/plan/units/new/page.tsx`
- `apps/web/src/app/ib/continuum/page.tsx`
- `apps/web/src/app/ib/planning/page.tsx`
- `apps/web/src/features/ib/pyp/*`
- `apps/web/src/features/ib/shared/IbUnitPlannerRouter.tsx`

---

## Testing requirements

### Unit/component tests
Add tests for:
- planner router chooses `PypUnitStudio` when appropriate
- POI board grid rendering and filtering
- summary drawer behavior
- Family Window tab preview rendering

### E2E scenarios
At minimum:
- PYP teacher creates a new PYP unit through the new unit flow
- teacher opens the unit and sees the PYP studio instead of the generic page
- coordinator opens the POI board and can inspect a unit from the grid

---

## Acceptance criteria
This task is complete only when:
- PYP has a real POI board
- PYP units use a real PYP-native editor
- the new unit flow can create a PYP planning object with context
- the generic unit page is no longer the primary experience for PYP
- the result is obviously more IB-native than the preexisting generic planner

---

## Handoff to Task 06
Task 06 will extend the PYP experience with:
- weekly flow
- action panel
- exhibition workspace
- richer family window and learning story integration
