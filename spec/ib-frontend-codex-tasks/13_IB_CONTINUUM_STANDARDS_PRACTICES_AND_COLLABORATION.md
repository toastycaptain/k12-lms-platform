# Task 13 — Continuum Map, Standards & Practices Board, and Collaboration Hub

## Goal
Build the cross-programme and coordinator surfaces that make the frontend useful for IB leadership, articulation, and programme coherence.

This task builds:
- `ContinuumMap`
- `StandardsAndPracticesBoard`
- `CollaborationHub`

---

## Why this task matters
The roadmap made it clear that an IB-native product needs more than teacher planning pages.

Coordinators and leadership need visible ways to manage:
- coherence across PYP → MYP → DP
- programme evidence
- standards & practices / evaluation readiness
- collaboration across grades, subject groups, and specialists

This is one of the areas where generic LMS platforms usually fail.

---

## Roadmap coverage
This task implements roadmap sections covering:
- `ContinuumMap`
- `StandardsAndPracticesBoard`
- `CollaborationHub`
- coordinator evidence dashboards
- cross-programme transition views
- schoolwide faculty workspace linked to curriculum objects
- Phase 5 coordinator/evidence deliverables where frontend-facing

---

## Required outcome
After this task:
- coordinators can navigate a cross-programme continuum surface
- standards & practices evidence is organized visually
- collaboration is linked to curriculum objects instead of living in detached messaging threads

---

## `ContinuumMap` requirements

### Purpose
Show how concepts, skills, learner profile attributes, and evidence evolve across PYP → MYP → DP.

### Required views
- concept progression
- ATL progression
- learner profile usage
- evidence density
- programme-to-programme transition views

### Suggested route
- `/ib/continuum`

### UX notes
This should feel like a meaningful map, not a static report page.
Use:
- filters
- chips
- summary cards
- drill-in drawers or side panels

---

## `StandardsAndPracticesBoard` requirements

### Purpose
Organize evidence for authorization/evaluation and internal quality review.

### Required features
- standards/practices tiles or sections
- linked evidence sources from planning, portfolio, policies, reflection logs, and family communication
- ownership and status chips
- export packet generation hooks or placeholders

### Suggested route
- `/ib/standards-practices`

### UX notes
This must help coordinators gather evidence without turning the frontend into a dead document repository.

---

## `CollaborationHub` requirements

### Purpose
Provide a schoolwide faculty workspace for:
- co-planning
- cross-grade articulation
- specialist/homeroom alignment
- coordinator feedback loops

### Important constraint
This should not just be a generic message area.
It should link directly to curriculum objects such as:
- units
- programmes
- projects
- evidence bundles

### Suggested route
- `/ib/planning/collaboration`
- or `/ib/continuum/collaboration` depending on IA preference

---

## Detailed implementation steps

### Step 1 — Build `ContinuumMap`
Create:
- `ContinuumMap.tsx`
- `ContinuumFilters.tsx`
- `ContinuumProgressionView.tsx`
- `ContinuumEvidenceDensityView.tsx`
- `ContinuumDrawer.tsx`

Support filtering by:
- programme
- concept
- ATL
- learner profile
- year level
- evidence type if useful

### Step 2 — Build `StandardsAndPracticesBoard`
Create:
- `StandardsAndPracticesBoard.tsx`
- `StandardsPracticesTile.tsx`
- `EvidenceLinkPanel.tsx`
- `OwnershipStatusStrip.tsx`
- `StandardsPracticesFilters.tsx`

Design for coordinator workflows, not just read-only viewing.

### Step 3 — Build `CollaborationHub`
Create:
- `CollaborationHub.tsx`
- `CollaborationObjectList.tsx`
- `CollaborationThreadPanel.tsx`
- `CrossGradeAlignmentView.tsx`
- `SpecialistContributionPanel.tsx`

Support object-linked collaboration rather than isolated discussion threads.

### Step 4 — Integrate with the home dashboard and shell
Add coordinator entry points and summary widgets where useful.

Examples:
- continuum snapshot card
- standards & practices status card
- collaboration follow-up card

---

## Important UX requirements

### Make cross-programme coherence visible
This should not feel like reading long reports.
A coordinator should be able to visually inspect progression and coverage.

### Avoid compliance-only design
Even standards & practices surfaces should feel interactive and useful, not like static evidence folders.

### Link collaboration to work objects
Teachers should be able to navigate from a unit or board to the related collaboration area and back.

---

## Files to modify or create
Likely files include:
- `apps/web/src/app/ib/continuum/page.tsx`
- `apps/web/src/app/ib/standards-practices/page.tsx`
- relevant dashboard modules from Task 03
- `apps/web/src/features/ib/coordinator/*`
- `apps/web/src/features/ib/shared/*`

---

## Testing requirements

### Unit/component tests
Add tests for:
- continuum filters and drill-ins
- standards/practices tile rendering and status display
- collaboration hub object-linked navigation

### E2E scenarios
At minimum:
- coordinator opens continuum map and filters by programme or ATL/concept
- coordinator opens standards & practices board and inspects linked evidence
- teacher/coordinator opens collaboration hub tied to a curriculum object

---

## Acceptance criteria
This task is complete only when:
- the product has meaningful cross-programme coordinator surfaces
- continuum views are interactive and useful
- standards & practices evidence is visually organized
- collaboration is anchored to curriculum work, not generic chatter

---

## Handoff to Task 14
Task 14 will modernize AI assistance so it writes into real structured IB fields rather than parsing generic markdown headings.
