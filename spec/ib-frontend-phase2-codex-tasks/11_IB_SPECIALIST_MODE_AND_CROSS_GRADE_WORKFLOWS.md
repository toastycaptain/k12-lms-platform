# Task 11 — Specialist Mode and Cross-Grade Contribution Workflows

## Dependency
Complete Tasks 01–10 first.

## Objective
Design explicitly for specialist teachers, cross-grade contributors, and staff who touch many units across the week, so the platform does not assume only homeroom or sole-owner workflows.

## Why this task exists now
- The roadmap identifies specialist workflow as a major opportunity to beat Toddle and as a common pain point in public educator feedback.
- Without a dedicated specialist mode, the system risks favoring one-class-one-teacher assumptions and becoming frustrating for music, PE, languages, arts, support specialists, MYP shared-subject staff, and coordinators who contribute without owning every unit.
- Specialist work is also a stress test of sticky context, quick actions, and queue design.

## Toddle / ManageBac pain this task must beat
- Avoid forcing specialists to re-enter the same note or resource separately across many units.
- Avoid showing specialists the same ownership-heavy dashboard as homeroom teachers.
- Avoid making timetable navigation and quick contribution impossible on small screens or between classes.

## Cross-curriculum guardrails
- Do not hard-code IB terminology into globally shared non-IB surfaces. Keep shared primitives generic and mount IB expressions under `apps/web/src/app/ib/**` and `apps/web/src/features/ib/**`.
- Do not invent new backend payloads if Route 3 backend work already exposed contracts. Inspect `packages/contracts/**`, generated frontend types, and existing `apiFetch` usage first.
- Prefer extending `packages/ui` for reusable UI primitives only when the primitive is curriculum-neutral. Keep PYP/MYP/DP-specific composition in the web app.
- Every workflow must honor the click-budget rule established in the roadmap: the common path should take fewer steps than Toddle/ManageBac equivalents.
- Every screen must support loading, empty, error, offline/poor-network, and insufficient-permission states.
- Accessibility is not optional: keyboard navigation, visible focus, screen-reader labels, semantic headings, and color-independent status indicators are required.
- All new data access should go through `apiFetch`, `useAppSWR`, existing auth context, and any route-specific hooks created in this task set.
- Where a task touches mobile behavior, build for high-value triage actions rather than full parity.

## Existing repo touchpoints to inspect first
- Teacher console from Task 03.
- PYP/MYP unit studio outputs from Tasks 05–08.
- Existing school/timetable-related context if available, plus school selector behavior.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/specialist/SpecialistDashboard.tsx`.
- `apps/web/src/features/ib/specialist/SpecialistContributionDrawer.tsx`.
- `apps/web/src/features/ib/specialist/MultiUnitAttachFlow.tsx`.
- `apps/web/src/features/ib/specialist/SchoolWeekPlanner.tsx`.

## Detailed implementation steps
1. Create a dedicated specialist-mode entry point in the teacher shell or mode switcher. It should show all units needing specialist input this week across grade levels and programmes where appropriate.
2. Separate 'owned units' from 'contributed units' visibly. Specialists often need to know where they have responsibility versus where they are simply adding expertise or evidence.
3. Build fast contribution modes: comment-only, evidence-only, resource-only, or quick-support note. These should not require opening the full unit studio every time.
4. Support one contribution attaching to multiple relevant units when pedagogically appropriate, with a clear preview of targets and the ability to tweak per unit if needed.
5. Create a school-week planner or timetable-aware queue that matches the rhythm of specialists moving through many classes. Surface next relevant contributions based on schedule if that data is available.
6. Ensure specialists can see coordinator comments or missing requests targeted at them without scanning whole units.
7. Keep permissions careful: specialists should not gain more access than intended when contributing across units.
8. Integrate specialist-mode quick links into evidence and family/publishing flows where specialists can contribute but not necessarily publish.

## Interaction and UX requirements
- Specialist mode must feel leaner than the full homeroom experience.
- The top of the page should answer 'where am I needed this week?' and 'what can I do in under a minute?'
- Cross-grade contribution should never feel like copy/paste drudgery.

## Data / contract integration rules
- Use backend Route 3 document/workflow/framework contracts as the source of truth. Do not create frontend-only payload dialects unless temporarily mocked behind a replaceable adapter.
- If a required response shape is unclear, inspect `packages/contracts/**`, generated types, and current `apiFetch` callsites before writing code.
- Where possible, create route- or feature-specific hooks rather than embedding fetch logic directly into page components.
- Preserve optimistic UI only where it is safe and reversible. Approval/publish actions need especially clear confirmation and status feedback.

## Loading / empty / error / permission states to design explicitly
- Initial page load and partial widget load.
- No data yet / newly onboarded school.
- No permission for the current role or school context.
- Backend temporarily unavailable or stale data warning.
- Poor connectivity / offline if the surface supports queued actions.

## Accessibility requirements
- Semantic headings and landmarks.
- Keyboard support for drawers, tabs/modes, and batch actions.
- Visible focus and non-color-only status encoding.
- Screen-reader labels for action buttons, filters, status pills, and timeline items.

## Tests to add
- Role tests for specialist visibility vs ownership.
- Multi-unit attach tests.
- Dashboard tests for timetable or queue ordering logic.

## Acceptance criteria
- Specialists have a dedicated high-signal experience.
- A contribution can be attached to multiple units safely and efficiently.
- Specialists can distinguish owned vs contributed work and act quickly between classes.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Tasks 12–13 should allow specialist contributions to feed evidence and family workflows without creating duplicate work.
