# Task 12 — IB Guardian Experience

## Goal
Turn guardian views into permissioned, understandable IB family experiences rather than generic read-only admin screens.

This task builds or upgrades:
- `LearningStoryFeed`
- `CurrentUnitWindow`
- `PortfolioHighlights`
- `ProgressSummary`
- `CalendarDigest`
- guardian navigation and page composition in IB mode

---

## Why this task matters
The roadmap identified a major gap: guardian routes currently feel generic and administrative.

IB schools need families to be able to follow learning through:
- current units
- learning stories
- learner profile / ATL context where appropriate
- upcoming milestones and deadlines
- clear support windows at home

But families should **not** see:
- raw planning notes
- internal teacher workflow clutter
- notification spam
- programme jargon without translation

---

## Roadmap coverage
This task implements roadmap sections covering:
- guardian nav in IB mode
- guardian dashboard gap
- family windows
- learning stories
- current unit windows
- portfolio highlights
- progress summary and calendar digest
- tiered family notifications

---

## Existing repo touchpoints
Current files to inspect and evolve:
- `apps/web/src/app/guardian/dashboard/page.tsx`
- `apps/web/src/app/guardian/students/[studentId]/page.tsx`
- `apps/web/src/app/guardian/progress/[studentId]/page.tsx`
- `apps/web/src/app/guardian/layout.tsx`
- family/evidence modules from Task 04

---

## Required outcome
After this task:
- guardians get an IB-specific information architecture
- family-facing learning stories and current unit windows are available
- guardian pages feel clear and calm instead of generic and limited
- permissioned student/family visibility is respected

---

## Guardian nav requirements
Visible IA in IB mode should support:
- Home
- Learning Stories
- Current Units
- Portfolio
- Progress Reports
- Calendar
- Messages

This can still live under `/guardian/*`, but the visible labels and page composition should be IB-native.

---

## `LearningStoryFeed` requirements

### Purpose
Provide families with a story-first view of learning moments.

### Required features
- chronological feed of published learning stories
- unit/context association
- optional learner profile / ATL chips in family-friendly language
- media previews where supported
- low-clutter presentation

### UX rules
- do not expose internal teacher fields
- do not overwhelm the feed with metadata
- make each story’s context understandable

---

## `CurrentUnitWindow` requirements

### Purpose
Give guardians a family-friendly window into what students are currently exploring.

### Required contents
- what we are learning/exploring now
- central idea or equivalent summary in approachable language
- key questions families can ask at home
- upcoming relevant milestones or events
- links to related learning stories or portfolio highlights when appropriate

### Route ideas
- `/guardian/students/[studentId]/current-units`
- or integrated into the student detail dashboard

---

## `PortfolioHighlights` requirements

### Purpose
Let guardians see approved/shared evidence highlights without exposing the full internal portfolio workflow.

### Required features
- curated or filtered highlight cards
- clear visibility of what is shared vs private
- link to evidence detail if family-visible

---

## `ProgressSummary` requirements

### Purpose
Show growth in a family-understandable way.

### Should emphasize
- progress themes
- important upcoming milestones
- recent evidence and reflection highlights
- criterion/ATL/project/core signals where appropriate

### Should avoid
- dumping raw teacher dashboards
- cluttered compliance tables

---

## `CalendarDigest` requirements

### Purpose
Provide a family-friendly digest of upcoming relevant dates.

### Include
- deadlines
- school/class events relevant to the student
- showcase or exhibition dates where relevant

Keep it focused and filter out noise.

---

## Detailed implementation steps

### Step 1 — Redesign guardian dashboard routing and layout for IB mode
Update guardian layout and dashboard composition so the experience is visibly different in IB mode.

### Step 2 — Build the family feed and unit window modules
Create:
- `LearningStoryFeed.tsx`
- `LearningStoryCard.tsx`
- `CurrentUnitWindow.tsx`
- `CurrentUnitWindowCard.tsx`
- `PortfolioHighlights.tsx`

### Step 3 — Build progress and calendar digest modules
Create:
- `GuardianProgressSummary.tsx`
- `GuardianCalendarDigest.tsx`
- `GuardianUpcomingDeadlinesCard.tsx`

### Step 4 — Integrate family notification preferences
Support the notification-tier model from earlier tasks.

The guardian UI should make it clear whether they are receiving:
- immediate notifications
- digest-only updates
- feed-only visibility

### Step 5 — Ensure permissioned rendering
All guardian-visible components must gracefully handle partial visibility.

For example:
- if a story is not family-visible, do not show it
- if a portfolio item is not shared, do not leak metadata from it

---

## UX requirements

### Calm information design
Guardian surfaces should feel calmer than teacher surfaces.
Use:
- fewer dense tables
- clear cards and sections
- family-friendly language
- lighter metadata treatment

### No jargon without translation
If you surface learner profile or ATL, label it in an understandable way and provide concise explanations where useful.

### Avoid spam patterns
The guardian surface should not encourage teachers to broadcast every minor change.

---

## Files to modify or create
Likely files include:
- `apps/web/src/app/guardian/dashboard/page.tsx`
- `apps/web/src/app/guardian/students/[studentId]/page.tsx`
- `apps/web/src/app/guardian/progress/[studentId]/page.tsx`
- `apps/web/src/app/guardian/layout.tsx`
- `apps/web/src/features/ib/guardian/*`
- `apps/web/src/features/ib/family/*`

---

## Testing requirements

### Unit/component tests
Add tests for:
- guardian nav composition in IB mode
- learning story feed rendering
- current unit window rendering
- portfolio highlights permission handling
- progress summary/card behavior

### E2E scenarios
At minimum:
- guardian opens dashboard and sees family-friendly sections
- guardian opens a linked student and views current learning
- guardian can read learning stories and see upcoming key dates
- guardian never sees teacher-only details

---

## Acceptance criteria
This task is complete only when:
- guardian IA reflects the roadmap’s IB family experience
- learning stories and current units are visible in a calm, permissioned way
- progress summaries are understandable and not raw internal data dumps
- the guardian experience feels materially more supportive than the current generic dashboard

---

## Handoff to Task 13
Task 13 will build the coordinator/cross-programme surfaces that connect evidence, planning, and standards/practices at school level.
