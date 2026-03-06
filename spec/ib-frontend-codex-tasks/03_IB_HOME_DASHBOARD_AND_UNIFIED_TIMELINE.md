# Task 03 — IB Home Dashboard and Unified Timeline

## Goal
Create a role-aware **IB home experience** that reduces fragmentation and immediately shows teachers, students, coordinators, and guardians what matters now.

This task also introduces the **unified timeline** pattern that later workspaces will reuse.

---

## Why this task matters
The roadmap highlighted a major adoption risk: users dislike tools where information is scattered, buried, or hard to find.

The home/dashboard experience should answer these questions instantly:
- What needs my attention now?
- What is happening across my units, projects, and deadlines?
- How does this connect to my programme role?

This is especially important in IB settings where teachers juggle:
- units
- assessments
- evidence
- projects/core obligations
- family communication
- schoolwide coordination

---

## Roadmap coverage
This task implements roadmap sections covering:
- the frontend north star as an IB workspace system
- role-aware home experiences
- unified timeline requirement
- “make timelines unified and reliable”
- “route-level IB home dashboard”
- the immediate next step to “build a unified teacher timeline/home dashboard”

---

## Existing repo touchpoints
Current routes/components likely involved:
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/learn/dashboard/page.tsx`
- `apps/web/src/app/guardian/dashboard/page.tsx`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/hooks/useCalendar.ts`
- any existing list/todo/calendar hooks

New modules should live under:
- `apps/web/src/features/ib/home/*`
- `apps/web/src/features/curriculum/timeline/*`

---

## Required outcome
After this task:
- IB teachers/coordinators see a dedicated home dashboard
- students and guardians get more coherent, role-appropriate dashboard surfaces
- a unified timeline component exists and can combine heterogeneous events
- the home view becomes a major navigation anchor rather than a generic placeholder

---

## Dashboard architecture

### Shared dashboard shell
Create a reusable shell component such as:
- `IbDashboardShell`

It should support:
- page title and description
- role-aware widget layout
- compact and expanded modes
- optional right-rail insights
- timeline section

### Widget composition model
Do not hard-code one giant dashboard file.

Create a lightweight widget registry or layout definition so the dashboard can render role-specific modules such as:
- teacher planning widgets
- coordinator overview widgets
- student progress widgets
- guardian learning windows

---

## Teacher dashboard requirements
Teachers in IB mode should see widgets like:
- **Units in progress**
- **Upcoming learning experiences**
- **Assessments and evidence checkpoints**
- **Projects/core milestones** relevant to their role
- **Recent family posts / pending family updates**
- **Portfolio/evidence needing validation**
- **Unified timeline**

Keep the screen focused. Do not cram every admin metric here.

### Specific teacher widgets to build
- `UnitsInProgressCard`
- `UpcomingLearningCard`
- `EvidenceQueueCard`
- `FamilyUpdatesCard`
- `ProjectsCoreSnapshotCard`
- `UnifiedTimelinePanel`

---

## Coordinator dashboard requirements
Coordinators need broader coherence visibility.

Suggested widgets:
- **Programme coherence snapshot**
- **Current unit/publication status**
- **Projects/core follow-up items**
- **Portfolio/evidence health**
- **Standards & practices evidence status**
- **Upcoming programme events or deadlines**
- **Unified timeline**

Specific widgets to build:
- `ProgrammeHealthCard`
- `PublicationQueueCard`
- `CoreCompletionCard`
- `EvidenceCoverageCard`
- `StandardsPracticesStatusCard`

---

## Student dashboard requirements
Student home should emphasize clarity and agency, not admin clutter.

Suggested widgets:
- **What’s next**
- **Current units / current inquiries**
- **Upcoming deadlines**
- **Portfolio prompts**
- **Project/core milestones**
- **Reflection prompts**
- **Unified timeline**

Keep language student-friendly.

---

## Guardian dashboard requirements
Guardian home should be calm and understandable.

Suggested widgets:
- **Current units overview**
- **Recent learning stories**
- **Upcoming calendar items**
- **Progress summary**
- **Important deadlines only**

Avoid dumping raw school operations or internal teacher details.

---

## Unified timeline requirements
This is a key cross-programme surface.

### Purpose
A unified timeline should combine, in one chronological view:
- lessons / learning experiences
- assessments
- projects and milestones
- family posts
- portfolio prompts
- calendar events
- deadlines

### Component structure
Create:
- `apps/web/src/features/curriculum/timeline/types.ts`
- `apps/web/src/features/curriculum/timeline/useUnifiedTimeline.ts`
- `apps/web/src/features/curriculum/timeline/UnifiedTimeline.tsx`
- `apps/web/src/features/curriculum/timeline/TimelineFilters.tsx`

### Event model
Standardize timeline items into a common shape:
- `id`
- `type`
- `title`
- `subtitle`
- `date/time`
- `status`
- `related document/context`
- `programme`
- `student/course if relevant`
- `action links`

### Display rules
- group by day or date segment
- support compact and expanded row variants
- show contextual tags (e.g. PYP, MYP, DP, CAS, unit, family)
- allow filtering by event type and programme
- preserve inline context so a teacher knows what each item belongs to

### Click-depth rule
From timeline rows, users should be able to:
- open the main object in one click
- optionally open in a drawer or new tab

---

## Detailed implementation steps

### Step 1 — Refactor `/dashboard` into a role-aware dashboard router
Create a thin route component that:
- reads user roles and curriculum runtime
- chooses the correct dashboard module
- falls back to non-IB/generic behavior when not in IB mode

### Step 2 — Build the dashboard widget components
Keep each widget isolated and testable.

Do not put all widget logic inside a single page file.

### Step 3 — Build `useUnifiedTimeline`
This hook may compose multiple backend endpoints or consume a dedicated timeline endpoint if available.

If backend already provides a unified event feed, use it.
If not, create a frontend adapter layer that normalizes multiple data sources into a shared shape.

Keep this adapter logic in one place.

### Step 4 — Add filter and saved-view behavior
Use the shared `FilterBar` from Task 02.

At minimum, support filtering timeline by:
- programme
- item type
- date window
- planning context/course if relevant

### Step 5 — Add a quick-action strip to the dashboard
The home dashboard should reduce navigation hops.

Examples:
- create unit
- add evidence
- share learning story
- open projects/core
- view current unit

Use the quick action framework introduced in Task 01.

### Step 6 — Wire analytics and UX telemetry
Instrument:
- widget clicks
- timeline filter usage
- time-to-open key objects from dashboard
- most-used quick actions

This supports later optimization work.

---

## State handling requirements
Every dashboard module must handle:
- loading
- empty state
- error state
- permission-limited state

Do not let a failed widget crash the whole dashboard.

Prefer:
- section-level resilience
- skeletons for high-frequency widgets
- concise empty-state guidance

---

## Files to modify or create
Likely files include:
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/learn/dashboard/page.tsx`
- `apps/web/src/app/guardian/dashboard/page.tsx`
- `apps/web/src/features/ib/home/*`
- `apps/web/src/features/curriculum/timeline/*`
- any relevant hooks under `apps/web/src/hooks/`

---

## Testing requirements

### Unit/component tests
Add tests for:
- role-based dashboard routing
- unified timeline item normalization
- timeline filtering
- widget rendering in loading/empty/error states

### E2E scenarios
At minimum:
- IB teacher opens dashboard and sees planning/evidence-oriented widgets
- IB student sees next actions and current learning, not teacher widgets
- guardian sees learning stories/current units summary
- clicking a timeline item opens the expected target route

---

## Acceptance criteria
This task is complete only when:
- `/dashboard` becomes a meaningful IB home surface for appropriate roles
- timeline data is unified into a single usable view
- users can act from the dashboard without excessive navigation
- the dashboard is resilient and not just a static mockup
- role-specific views feel materially different and appropriate

---

## Handoff to Task 04
Task 04 will build the portfolio/evidence and learning-story foundation.

The dashboard created here should already have obvious places to surface:
- evidence needing validation
- recent learning stories
- portfolio prompts
- family updates
