# Task 23 — Design QA, Click Budgets, Accessibility, and Release Gates

## Dependency
Complete Tasks 01–22 first.

## Objective
Create the final quality-control layer for the IB phase-2 build so the product is measured against click budgets, role journeys, accessibility, regression risk, and competitor pain points before release.

## Why this task exists now
- The roadmap explicitly calls for click-budget design reviews and role-journey testing, especially for teachers, specialists, coordinators, heads of school, and families.
- Without explicit release gates, the product can easily become beautiful but too effortful — the exact failure mode the roadmap is trying to avoid.
- This task turns the design philosophy into enforceable QA criteria.

## Toddle / ManageBac pain this task must beat
- Avoid shipping a large set of screens without validating whether real journeys got faster.
- Avoid accessibility or mobile regressions caused by the rapid addition of drawers, modes, and dashboards.
- Avoid silent drift back toward click-heavy legacy patterns.

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
- All tasks 01–22 outputs.
- Existing frontend testing setup, accessibility specs, performance docs, and any E2E framework already present in the repo.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/qa/` notes or test fixtures if useful.
- A documented click-budget matrix and role-journey UAT plan.
- Playwright/Vitest coverage additions if the repo already supports them.

## Detailed implementation steps
1. Define core role journeys: PYP homeroom teacher, PYP specialist, MYP subject teacher, DP teacher, PYP coordinator, MYP coordinator, DP coordinator, Head of School/IB Director, guardian, and student.
2. For each journey, map start-of-day, interruption recovery, approval moment, family communication moment, review/evaluation-prep moment, mobile moment, and 'I only have two minutes' moment.
3. Translate the roadmap’s click-budget philosophy into explicit thresholds. Examples: open current unit from home in 1 click; validate evidence in 2 clicks or fewer; publish family story from evidence in 3 clicks or fewer; approve a unit in 2–3 clicks; reach next EE follow-up in 1 click from dashboard.
4. Create accessibility QA checklist specific to the new IB features: keyboardable drawers, mode switches, color-independent statuses, table/chart alternatives, and focus management across split-pane flows.
5. Add regression tests or scripted manual runs for the most important journeys and their mobile variants.
6. Define release gates: route completeness, performance budgets met or within agreed range, no mock data left in production IB surfaces, all major queues with empty/error/loading states, and no known dead-end cards.
7. Document explicit anti-goals: no surprise modal traps, no hidden unpublished state, no generic admin pages masquerading as coordinator tools, no AI auto-apply, no family feed spam.

## Interaction and UX requirements
- Quality criteria must be written in user language, not only engineering language.
- Click budgets should expose friction honestly rather than becoming vanity metrics.
- QA should protect calm, clarity, and trust as much as correctness.

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
- Journey-based E2E or high-level integration tests where practical.
- Accessibility scans plus manual keyboard walkthroughs.
- Performance regression checks using the budgets from Task 22.

## Acceptance criteria
- IB phase 2 has documented release gates, click budgets, and role-journey checks.
- There is a concrete way to say whether the product is actually calmer/faster than before.
- The build is protected against the most likely regressions back toward Toddle/ManageBac weaknesses.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Use Task 24 as the final coverage audit and Task 25 when spinning up or resuming Codex work.
