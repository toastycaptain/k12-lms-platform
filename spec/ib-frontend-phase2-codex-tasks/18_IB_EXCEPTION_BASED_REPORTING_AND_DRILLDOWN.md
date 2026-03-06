# Task 18 — Exception-Based Reporting and Drilldown Analytics

## Dependency
Complete Tasks 01–17 first.

## Objective
Turn reporting into actionable oversight by surfacing outliers, timing issues, health gaps, and drilldown routes rather than charts that stop at summary level.

## Why this task exists now
- The roadmap explicitly says most leaders do not need more dashboards; they need actionable visibility.
- Report value comes from helping schools decide what to do next, not from generating attractive but dead-end charts.
- This task consolidates the data emerging from unit studios, evidence, publishing, review, DP milestones, and standards/practices into exception-first reports.

## Toddle / ManageBac pain this task must beat
- Avoid dashboard theater — charts without routes into the underlying work.
- Avoid reporting that duplicates the Programme Operations Center but with less actionability.
- Avoid dumping every metric at once; reports should answer specific governance questions.

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
- Current report pages under `apps/web/src/app/report` and related admin analytics pages.
- Tasks 14–17 outputs and the data those surfaces expose.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/reports/page.tsx` and subordinate report routes if needed.
- `apps/web/src/features/ib/reports/ExceptionReportShell.tsx`.
- Specific report modules for POI balance, MYP criteria timing, ATL distribution, evidence density, family publishing cadence, DP IA risk, EE supervision health, CAS completion risk, standards/practices evidence gaps.

## Detailed implementation steps
1. Design report IA around questions that matter: where are gaps, where is timing imbalanced, which cohorts or teams are under-supported, which milestones are at risk, and where is evidence weak.
2. Implement filters by programme, year, teacher, school, planning context, status, and date range where meaningful. Keep defaults opinionated toward current action.
3. Ensure every report view includes exception banners or prioritized findings, not just tables/charts.
4. Every chart or summary block must drill into live work: document list, evidence queue, review queue, publishing queue, or individual object route.
5. Provide export/share mode, but do not let export become the primary usage pattern. The on-screen report must still guide action.
6. Align report language with coordinator workflows from Task 14 and not with generic corporate analytics conventions.

## Interaction and UX requirements
- Reports should help a coordinator think, not force them to decode visual noise.
- Actionability beats novelty. A smaller set of high-value reports is better than a huge report catalog.
- Drilldown must preserve filter context whenever possible.

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
- Report filter and drilldown tests.
- Regression tests against dead-end chart interactions.
- Accessibility checks for charts/tables and text alternatives.

## Acceptance criteria
- IB reporting is exception-based and action-linked.
- The named high-value reports from the roadmap exist or are clearly scaffolded with live data paths.
- Coordinators can move from report to live work without re-filtering from scratch.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 19 will refine student/guardian calm-mode using publishing and progress data; Task 23 will enforce release gates against chart-heavy regressions.
