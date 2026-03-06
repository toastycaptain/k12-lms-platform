# Task 15 — Performance, Mobile, Accessibility, Testing, and Release Gates for the IB Frontend

## Goal
Finish the IB frontend buildout by making it production-trustworthy:
- performant on heavy planning/reporting screens
- usable for core teacher/student/family tasks on mobile and tablet
- accessible
- thoroughly tested
- measurable in real use

---

## Why this task matters
The roadmap explicitly warns against reproducing the reputation problems of other platforms:
- slow/heavy pages
- poor mobile parity
- cluttered workflows
- inaccessible defaults
- unmeasured UX regressions

By this point, the app will have gained many rich surfaces. This task ensures the product remains fast, usable, and supportable.

---

## Roadmap coverage
This task implements roadmap sections covering:
- performance, mobile, and trustworthiness phase
- dark mode/accessibility follow-through
- route weight budgets
- click depth and task completion instrumentation
- offline-friendly draft capture where relevant
- testing strategy and performance budgets
- final release gates

---

## Existing repo touchpoints
Current relevant areas include:
- `apps/web/src/lib/performance.ts`
- `apps/web/src/components/WebVitalsReporter.tsx`
- `apps/web/src/lib/offlineMutationQueue.ts`
- existing tests under `apps/web/src/app/__tests__/`
- any Playwright/e2e setup already present in repo specs or scripts

---

## Required outcome
After this task:
- core IB routes have route-level performance expectations and optimization work applied
- mobile/tablet use for common tasks is credible
- accessibility and theme behavior are production quality
- a complete test matrix exists for the new IB experiences
- release gates and instrumentation make UX regressions visible

---

## Performance requirements

### Route-level priorities
Focus on the heaviest or highest-frequency routes:
- IB home dashboard
- PYP unit studio
- POI board
- MYP unit studio
- projects hub
- DP assessment/dashboard pages
- portfolio feed and evidence detail views
- guardian family views

### Optimization strategies to apply
Use:
- server-rendered shells where appropriate
- client islands only for interactive sections
- `Suspense` boundaries / streaming where useful
- lazy-loaded heavy panels and comparison views
- virtualized lists/grids where dataset size warrants it
- memoization and stable keys to reduce re-renders
- granular data fetching rather than one huge client payload

### Specific anti-patterns to reduce
The roadmap called out many pages being full `"use client"` pages.
Audit and reduce that where it materially improves route cost.

---

## Mobile and tablet requirements

### Non-negotiable mobile parity targets
No core teacher action should require desktop-only access if it is a daily task.

Examples of core tasks that should be mobile/tablet-credible:
- open current unit
- add or review evidence
- share a learning story
- view upcoming milestones
- check family-visible content
- review a student project milestone

### UX requirements
- touch targets are comfortable
- sticky bars collapse intelligently on small screens
- drawers and split views degrade gracefully
- dense tables offer card/stack fallback modes
- upload and compose flows do not break on mobile browsers

### Tablet expectations
Many teachers use tablets in classrooms.
Design tablet breakpoints as first-class, not as “large phones.”

---

## Accessibility requirements

### Baseline requirements
Ensure:
- keyboard navigation works on all major surfaces
- focus order is logical
- dark mode maintains contrast
- tabs/drawers/palettes/modals announce correctly
- drag/drop interactions have accessible fallbacks where possible
- reduced motion preferences are honored where relevant
- compact mode remains legible and usable

### Specific areas to verify carefully
- command palette
- split pane
- POI board interactions
- evidence drawers
- project milestone timelines
- guardian current unit / learning story feeds

---

## Offline and resilience requirements
Where relevant, support reliable draft behavior.

Potential flows that benefit from queued/offline-friendly handling:
- writing reflections
- composing learning stories
- adding evidence metadata before upload finalization
- small planner edits

If the app already has `offlineMutationQueue`, use it thoughtfully.
Do not overpromise full offline planning unless truly reliable.

---

## Instrumentation requirements
Track at minimum:
- first interaction time on planner pages
- time to open a unit/editor
- time to render timeline-heavy views
- time to open report/coordinator pages
- time to complete AI diff apply
- click depth for common teacher tasks
- abandonment/dropoff for high-frequency workflows where possible

Add analytics events or performance markers in a way the team can use to detect regressions.

---

## Testing requirements

### Unit tests
Expand coverage for:
- runtime navigation composition
- terminology switching where relevant in IB mode
- role visibility rules
- theme/density persistence
- autosave state transitions

### Component tests
Cover:
- POI board interactions
- concept/context builder
- portfolio evidence tagging
- split pane compare view
- autosave status changes
- AI diff preview
- guardian family cards
- DP milestone panels

### E2E journeys
Implement at least the journeys called out by the roadmap.

#### PYP journeys
- create unit of inquiry
- add learning experiences
- publish family update
- add action evidence
- view POI update

#### MYP journeys
- create unit with global context and statement of inquiry
- attach criteria-based assessment
- launch interdisciplinary collaboration
- manage project checkpoint

#### DP journeys
- create course map
- update IA milestone
- supervise EE meeting
- log CAS evidence
- review TOK submission

#### Guardian journeys
- open current unit window
- view learning story
- view progress summary
- locate next key deadline

### Performance budgets
Track and enforce budgets for:
- first interaction time on planner pages
- time to open a unit
- time to render class timeline
- time to open report page
- time to apply AI diff

Use realistic thresholds appropriate to the app’s deployment target; document them in code or adjacent docs.

---

## Release checklist
Before this work is considered releasable, verify:
- IB shell/navigation is stable
- PYP/MYP/DP key surfaces are available and not hidden behind broken placeholders
- portfolio and family routes are real and permission-safe
- no route blocks keyboard navigation
- dark mode and compact mode are production-ready
- mobile and tablet smoke checks pass on the top daily workflows
- analytics/performance hooks are active for key journeys
- there is no major regression to non-IB paths

---

## Files to modify or create
Likely files include:
- `apps/web/src/lib/performance.ts`
- `apps/web/src/components/WebVitalsReporter.tsx`
- `apps/web/src/lib/offlineMutationQueue.ts`
- relevant route files across all previous tasks to reduce client weight and improve composition
- test files across `apps/web/src/app/`, `apps/web/src/components/`, and feature folders

---

## Acceptance criteria
This task is complete only when:
- key IB routes are measurably optimized
- mobile/tablet use for core tasks is viable
- accessibility checks cover the new interaction patterns
- the test matrix covers PYP, MYP, DP, and guardian journeys
- performance and UX instrumentation exist to catch regressions over time

---

## Final completion condition for the IB frontend sequence
The entire IB buildout is only done when this task is done and the product can credibly claim all of the following:
- modern information architecture
- PYP/MYP/DP-native planning and coordination surfaces
- evidence-first portfolio and family experiences
- lower-friction workflows than the main competitor pain points described in the roadmap
- production-level performance, accessibility, and mobile trustworthiness
