# Task 06 — PYP Weekly Flow, Action Panel, Exhibition, and Family Window

## Goal
Deepen the PYP experience beyond the unit shell by building the key workflow surfaces that make day-to-day PYP delivery and visibility much easier:
- `PypWeeklyFlow`
- `PypActionPanel`
- `PypExhibitionWorkspace`
- richer `FamilyWindowCard` and related family publishing flows

---

## Why this task matters
A PYP unit planner alone is not enough. Teachers also need a clear way to answer:
- what happens when?
- where does student action live?
- how do we handle exhibition properly?
- how do we turn unit planning into family-friendly visibility?

These are common areas where tools become cluttered or force teachers into workarounds.

---

## Roadmap coverage
This task implements roadmap sections covering:
- `PypWeeklyFlow`
- `PypActionPanel`
- `PypExhibitionWorkspace`
- `FamilyWindowCard`
- family-facing PYP summaries
- `LearningStoryComposer` usage in PYP contexts
- Phase 2 deliverables beyond the unit studio

---

## Existing dependencies
This task assumes Task 04 and Task 05 are complete enough that you have:
- portfolio/evidence foundation
- learning story composer foundation
- PYP unit studio and POI board

---

## Required outcome
After this task:
- a PYP teacher can visually unpack a unit over time
- student action is visible and manageable
- exhibition has a dedicated workspace rather than a generic assignment workaround
- the family-facing PYP surface is concrete and useful

---

## `PypWeeklyFlow` requirements

### Purpose
Visually unpack the unit over weeks and reduce planning confusion.

### Features
- week columns
- drag learning experiences into weeks
- show evidence checkpoints inline
- show which experiences are shared with families
- show specialist contributions inline
- compact and expanded modes

### Recommended route usage
Embed this as:
- a tab or subview inside the PYP unit studio
- optionally a fuller planning board route under `/ib/planning/pyp/units/[id]/weekly`

### UX notes
- the weekly view should not require a giant spreadsheet-like interface
- rows or cards should remain legible in compact mode
- dragging should have clear keyboard-accessible fallbacks if full DnD is implemented

---

## `PypActionPanel` requirements

### Purpose
Track unit-related student action in a meaningful, visible way.

### Features
- teacher-curated action opportunities
- student-submitted action evidence
- class-level action board
- approval/celebration states
- links to portfolio evidence where relevant

### UI patterns
Use:
- timeline or board-like layout
- status chips
- lightweight review flow
- filters by student / status / class-level action

Avoid burying action as a paragraph in reflection notes.

---

## `PypExhibitionWorkspace` requirements

### Purpose
Provide a dedicated exhibition environment instead of improvised unit/assignment hacks.

### Features
- mentor assignments
- checkpoints
- inquiry logs
- evidence collection
- family/showcase surfaces
- final presentation logistics

### Suggested route
- `/ib/projects-core/pyp-exhibition`

### Suggested internal sections
- Overview
- Students / groups
- Mentors
- Checkpoints
- Evidence
- Showcase / Presentation
- Family updates

### Important UX requirement
This workspace must reduce spreadsheet dependence.

Provide clear milestone visibility and student grouping without forcing the user into dense tables only.

---

## `FamilyWindowCard` and family publishing requirements

### Purpose
Every PYP unit should be able to surface a calm, family-facing summary.

### Required contents
- what we are exploring
- central idea in family-friendly language
- lines of inquiry summarized without jargon
- learner profile focus
- questions to ask at home
- recent learning story highlights

### Authoring flow
Teachers should be able to manage this inside the unit studio without sending a blast notification every time.

Support:
- draft preview
- publish silently
- publish with digest inclusion
- publish with immediate notification

---

## Detailed implementation steps

### Step 1 — Build `PypWeeklyFlow`
Create modules such as:
- `PypWeeklyFlow.tsx`
- `PypWeekColumn.tsx`
- `PypLearningExperienceCard.tsx`
- `PypWeeklyFlowFilters.tsx`

Integrate with unit data and learning experiences.

If reorder persistence is supported by the backend, wire it.
If not, build the UI in a way that can persist once the endpoint is available.

### Step 2 — Build `PypActionPanel`
Create modules such as:
- `PypActionPanel.tsx`
- `PypActionOpportunityCard.tsx`
- `PypActionSubmissionDrawer.tsx`
- `PypActionCelebrationStrip.tsx`

Tie into the evidence foundation from Task 04 wherever possible.

### Step 3 — Build `PypExhibitionWorkspace`
Create modules such as:
- `PypExhibitionWorkspace.tsx`
- `ExhibitionMentorPanel.tsx`
- `ExhibitionCheckpointTimeline.tsx`
- `ExhibitionEvidenceGallery.tsx`
- `ExhibitionShowcasePanel.tsx`

Even if some data endpoints are still maturing, establish the route, layout, and review flows.

### Step 4 — Enhance the PYP Family Window experience
Build or refine:
- `FamilyWindowCard.tsx`
- `FamilyWindowPreview.tsx`
- `FamilyQuestionSuggestions.tsx`
- `FamilyUpdateLevelSelector.tsx`

Integrate with `LearningStoryComposer` where appropriate.

### Step 5 — Add family-facing routes or feed integration as needed
Depending on how Task 12 is later structured, family content may already be rendered in guardian routes.

For now, ensure the authoring and preview pathways exist from the teacher side.

---

## Key UX requirements

### Lower the effort of “showing learning”
Teachers should be able to publish a family-facing update quickly from their existing unit context.

Do not force them to:
- open multiple separate tools
- re-enter unit metadata manually
- choose from too many notification options every time

### Make weekly flow legible
The weekly flow is meant to reduce confusion, not create another dense board.

Use:
- clear visual groupings
- lightweight cards
- inline evidence markers
- specialist contribution markers

### Keep exhibition serious but not bureaucratic
The exhibition workspace must feel significant and organized without reading like compliance software.

---

## Files to modify or create
Likely files include:
- `apps/web/src/features/ib/pyp/*`
- additions to PYP unit studio tabs and routes
- `apps/web/src/app/ib/projects-core/page.tsx`
- optional new route(s) for exhibition

---

## Testing requirements

### Unit/component tests
Add tests for:
- weekly flow rendering and filtering
- action panel states
- family window preview rendering
- exhibition workspace sections and empty states

### E2E scenarios
At minimum:
- teacher opens a PYP unit and manages weekly flow
- teacher records or reviews action evidence
- teacher opens exhibition workspace and views checkpoints
- teacher previews a family window and publishes a family-safe update

---

## Acceptance criteria
This task is complete only when:
- PYP weekly flow exists and is useful
- action is visible as a dedicated surface
- exhibition has a dedicated workspace
- family windows are authored and previewed in a meaningful way
- the PYP experience now covers planning, pacing, action, exhibition, and family visibility

---

## Handoff to Task 07
Task 07 begins the MYP-specific buildout with a concept/context/criteria-aware unit experience.
