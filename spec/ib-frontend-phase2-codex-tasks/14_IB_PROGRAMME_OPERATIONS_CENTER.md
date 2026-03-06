# Task 14 — Build the IB Programme Operations Center

## Dependency
Complete Tasks 01–13 first.

## Objective
Create the main coordinator/admin operations environment where programme health, approvals, gaps, evidence readiness, publishing rhythm, and cross-team support needs are visible in one place.

## Why this task exists now
- The roadmap calls this the biggest admin-facing gap.
- Coordinators need a place to run the programme, not just a nicer admin dashboard.
- This workspace should unify the summary work from Task 04 with drilldown-heavy operational tools that later tasks deepen.

## Toddle / ManageBac pain this task must beat
- Avoid forcing coordinators to context-switch across PYP, MYP, DP, evidence, standards/practices, and approvals just to understand what needs help.
- Avoid building one giant page of equally weighted widgets. Coordinators need health plus direct drilldown.
- Avoid metrics with no path to action.

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
- Coordinator home from Task 04.
- All programme-specific operations from Tasks 05–13.
- Existing admin and report patterns that may provide table/filters/export shells.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/operations/page.tsx` or canonical coordinator route.
- `apps/web/src/features/ib/operations/ProgrammeOperationsCenter.tsx`.
- Widgets for PYP POI health, MYP criteria/interdisciplinary health, DP IA/core risk, evidence queue health, family cadence, approvals, standards/practices completeness.
- Drilldown cards or split-pane list/detail patterns.

## Detailed implementation steps
1. Design the Programme Operations Center around one question: what is healthy, what is overdue, what is incomplete, what needs approval, and which teams need support?
2. Build role-specific widget composition: PYP Coordinator, MYP Coordinator, DP Coordinator, and whole-school IB leader. Reuse a common shell but change priorities and drilldown default routes.
3. Use exception-first cards with embedded counts, concise explanation, and direct routes to the specific queue or document set requiring action.
4. Integrate PYP POI gaps/overlaps, specialist-missing signals, MYP criterion balance and interdisciplinary draft status, DP IA/core follow-up, evidence queue health, family publishing cadence, approvals, and standards/practices evidence readiness.
5. Support school/programme filters but preserve the top priority exceptions even when filters are broad.
6. Make every widget drill into a live document list or operations queue rather than a dead-end chart page.
7. Support coordinator work mode and sticky context from Task 02 so the center behaves like a daily command surface, not a one-off report.

## Interaction and UX requirements
- The center must feel decisive, not decorative.
- Surface only the most important counters at first glance. Details belong in drilldown panes.
- Use plain language around risk and blockers so coordinators can scan quickly during busy school days.

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
- Role-based widget composition tests.
- Drilldown navigation tests for each major card.
- Permission tests ensuring only intended coordinator/admin roles see this route.

## Acceptance criteria
- There is one coherent IB Programme Operations Center with role-appropriate views.
- The center integrates programme, evidence, publishing, review, and standards/practices health.
- Every metric or exception card drills into live work.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Tasks 15–18 now deepen the individual governance, evidence, review, and reporting modules linked from this center.
