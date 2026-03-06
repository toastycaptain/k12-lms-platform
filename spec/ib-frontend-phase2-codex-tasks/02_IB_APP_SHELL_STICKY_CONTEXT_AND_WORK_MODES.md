# Task 02 — Build the IB Shell, Sticky Context, and Work Modes

## Dependency
Complete Task 01 first so route destinations are stable.

## Objective
Replace the generic-feeling IB entry experience with a dedicated IB shell that preserves programme/school/object context, supports multiple work modes, and reduces repetitive re-navigation.

## Why this task exists now
- The roadmap makes sticky context a product rule: teachers and coordinators must not repeatedly re-establish programme, year group, unit, class, role, or school context.
- This is a direct response to common frustration with legacy platforms where users keep losing where they are, especially when switching between specialist work, approvals, and family-facing views.
- A dedicated shell is the place to embed persistent context rail, recent objects, quick actions, and the mode switcher needed for planning, teaching, meeting, coordinator review, and family preview.

## Toddle / ManageBac pain this task must beat
- Avoid ManageBac-style navigation sprawl where each section has its own unrelated filters and the user must reconstruct context by hand.
- Avoid Toddle-style click depth when moving from a unit to evidence to family view to comments and back.
- Avoid opening separate parallel apps for teachers, coordinators, and families; keep one coherent shell with role-appropriate surfaces.

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
- `apps/web/src/components/AppShell.tsx` — existing global shell and nav logic that still reflects generic K–12 structure.
- `apps/web/src/lib/api.ts`, `apps/web/src/lib/swr.ts`, `apps/web/src/lib/swr-mutations.ts` — shared API and data-fetching layer.
- `apps/web/src/lib/auth-context.tsx` — current user, roles, curriculum runtime, and school context.
- `apps/web/src/components/SchoolSelector.tsx` and `TopRightQuickActions.tsx` — current shared affordances that may be reused or wrapped.
- `apps/web/src/components/StudentProgressView.tsx` — current generic progress presentation that will need IB-specific overlays or replacements.
- `apps/web/src/app/dashboard`, `apps/web/src/app/plan`, `apps/web/src/app/learn`, `apps/web/src/app/guardian`, `apps/web/src/app/admin` — generic route families to inspect before creating IB-specific replacements.
- `packages/contracts/**` — source of truth for runtime curriculum packs, document schemas, workflows, and backend contract expectations.
- `packages/ui/**` — neutral UI primitives to extend carefully where it reduces duplication without baking in IB semantics.
- `apps/web/src/components/AppShell.tsx` — current generic shell to refactor or wrap rather than duplicating everything from scratch.
- `apps/web/src/components/SchoolSelector.tsx` — school context persistence entry point.
- Existing auth bootstrap that exposes curriculum runtime, visible navigation, and roles.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/layout/IbShell.tsx` — dedicated shell component.
- `apps/web/src/features/ib/layout/IbContextRail.tsx` — persistent school/programme/object context rail.
- `apps/web/src/features/ib/layout/IbWorkModeSwitch.tsx` — planning/teaching/meeting/coordinator review/family preview mode switch.
- `apps/web/src/features/ib/core/useIbContext.ts` — hook for reading/writing persisted IB navigation context.
- Optional lightweight store module for recents, last object visited, open side panels, and active mode.

## Detailed implementation steps
1. Decide whether to wrap or partially replace the generic `AppShell`. Shared authentication, school selection, and notification affordances may stay common, but the `/ib/**` surface needs its own left-nav grouping, secondary workspace navigation, and context presentation.
2. Implement a persistent context model that survives navigation and refresh. At minimum track school, programme (PYP/MYP/DP), academic year if applicable, planning context or course, active document/evidence object, and current work mode.
3. Expose the context model through a hook and optionally local/session storage keyed by school + user. Do not leak one school’s context into another school.
4. Build a context rail visible on IB routes that shows the current programme, object, school, and relevant review/publish state. This rail should allow quick pivoting without forcing the user back to a dashboard.
5. Implement work modes as a first-class UX concept: Planning mode (field detail, inspectors, comments), Teaching mode (day-of-use simplification), Meeting mode (projection-safe review layout), Coordinator review mode (approval + health + drilldown), Family preview mode (guardian-facing render).
6. Make work modes persistent per route family when appropriate. Example: if a coordinator chooses review mode in standards/practices or approvals, preserve it while they move across related pages.
7. Add a recent-items tray and 'continue where I left off' support wired to the route system from Task 01.
8. Support side-panel navigation without losing page context. Drawers must integrate with browser history or an explicit close/back model so the user never feels trapped.
9. Update top-level IB navigation labels and grouping to reflect the roadmap’s workspace model: Home, Continuum, Planning, Learning, Assessment, Portfolio, Projects & Core, Families, Standards & Practices, Reports.
10. Preserve cross-curriculum safety: only IB routes should render this shell. Generic American/British routes should continue to use their own pack-driven shell behavior.

## Interaction and UX requirements
- The shell must always reveal where the user is, what they are looking at, and what the next likely action is.
- Context switching should be fast but never accidental. Changing school, programme, or object should visibly confirm what changed.
- Support keyboard-accessible mode switching and quick action access.
- Use calm, low-noise visual hierarchy. Persistent context should reduce anxiety, not become another strip of unreadable metadata.

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
- Component tests for mode switching, context persistence, and recent-item restoration.
- Route tests proving context survives refresh and internal navigation.
- Accessibility checks for keyboard navigation, announcements, and visible focus in the new shell.

## Acceptance criteria
- IB routes render inside a dedicated shell with persistent context and clear workspace grouping.
- Users can switch work modes without losing the current object.
- The shell remembers last-worked context and can resume meaningful work in one interaction.
- No shared non-IB shell labels are globally renamed to IB-specific language.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Tasks 03 and 04 rely on this shell to present teacher and coordinator action consoles without repeated setup friction.
