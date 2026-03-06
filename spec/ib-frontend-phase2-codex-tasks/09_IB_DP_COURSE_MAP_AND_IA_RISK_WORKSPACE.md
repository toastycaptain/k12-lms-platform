# Task 09 — DP Course Map, Year 1/Year 2 Flow, and IA Risk Workspace

## Dependency
Complete Tasks 01–08 first.

## Objective
Create a serious DP operations surface centered on course maps, Year 1/Year 2 progression, internal-assessment readiness, risk identification, and intervention-oriented drill-down.

## Why this task exists now
- The roadmap states that DP needs operational seriousness more than visual novelty.
- DP teachers and coordinators need milestone and readiness visibility that generic course pages do not provide.
- This is a major opportunity to beat antiquated UX patterns that bury high-risk student milestones inside dense table screens.

## Toddle / ManageBac pain this task must beat
- Avoid making DP look like a generic course page with a few IA badges sprinkled on top.
- Avoid charts that show risk without exposing the students or milestones driving the alert.
- Avoid requiring teachers to jump between course map, assessment tracker, and student list to understand readiness.

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
- Any existing course-map or DP prototype work if present.
- Generic assessment analytics, report, or teacher-progress pages that may provide reusable skeletons or tables.
- Backend document and workflow endpoints for DP course maps and IA milestones.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/dp/courses/[courseId]/page.tsx` or equivalent route.
- `apps/web/src/features/ib/dp/DpCourseMapWorkspace.tsx`.
- Subcomponents for Year 1/Year 2 toggle, IA traffic-light dashboard, milestone board, student drilldown, and coordinator table/timeline dual view.

## Detailed implementation steps
1. Design the DP course map around the two-year arc. Provide a clear Year 1 / Year 2 toggle or split visualization that preserves continuity rather than hiding one year entirely.
2. Add IA readiness and milestone status in a way that is visible but not overwhelming. The course map should make it obvious which milestones are upcoming, overdue, or at risk.
3. Implement traffic-light or equivalent status summaries only if they always drill into the actual students or artefacts behind the status.
4. Provide smart filters such as 'needs intervention', 'awaiting teacher feedback', 'missing draft', 'ready for review', or 'family support useful'.
5. Support coordinator-friendly dual views: a timeline perspective for sequencing and a table perspective for bulk scanning/export.
6. Show where course units or major learning blocks connect to IA milestones without turning the map into a giant tangled diagram.
7. Make bulk student milestone nudges possible but safe. The UI should preview recipients and wording before sending.
8. Keep assessment-readiness export requirements in mind; coordinators often need clean snapshots, not only on-screen views.

## Interaction and UX requirements
- A DP teacher should immediately understand which students or milestones are off-track.
- The course map should feel rigorous and professional, not decorative.
- Risk should be specific and actionable, not abstract color-coding.

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
- Course-map rendering tests with Year 1/Year 2 toggles.
- IA risk filter tests.
- Drilldown navigation tests from risk cards to student or milestone detail.

## Acceptance criteria
- DP course pages present a real two-year operations model with IA readiness visibility.
- Teachers and coordinators can filter to at-risk items and act from the same workspace.
- The route supports both timeline and tabular review modes.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 10 extends DP operations into EE, TOK, CAS, advisor/supervisor triage, and family-support previews.
