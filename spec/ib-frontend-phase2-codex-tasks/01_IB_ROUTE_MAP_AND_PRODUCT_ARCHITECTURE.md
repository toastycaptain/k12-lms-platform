# Task 01 — Complete the IB Route Map and Product Architecture

## Dependency
Read `00_IB_PHASE2_MASTER_EXECUTION.md` first.

## Objective
Establish a final, coherent `/ib/**` route and information architecture so every IB workspace, card, and deep link resolves to a real place and shares consistent object-based URL patterns.

## Why this task exists now
- The roadmap explicitly identifies route incompleteness as the first blocking issue: the shell and cards can feel deep, but many routes still behave like static showcase endpoints.
- Nothing else in phase 2 will feel trustworthy if dashboards, badges, and widgets point to missing, duplicated, or inconsistent destinations.
- A stable URL model is also the foundation for coordinator drill-down, teacher resume behavior, approvals, evidence review, and family preview.

## Toddle / ManageBac pain this task must beat
- Avoid the ManageBac-style feeling of endless nested screens where the user is never sure if they are in the live object or a reporting wrapper around it.
- Avoid Toddle-style click chains where a teacher needs multiple transitions just to reach the place they were already in yesterday.
- Avoid dead-end analytics or dashboard cards that summarize something but cannot open the actual work.

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
- `apps/web/src/app/layout.tsx` and existing app-router conventions.
- Any existing curriculum-pack navigation config or runtime nav exposure from `/api/v1/me` or equivalent auth bootstrap.
- Generic route families under `plan`, `learn`, `guardian`, `admin`, and `report` to identify reusable patterns and avoid collisions.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/layout.tsx` — the dedicated IB route-family shell entry if not already present.
- `apps/web/src/app/ib/page.tsx` or redirect entry for the IB home root.
- A route registry module such as `apps/web/src/features/ib/core/route-registry.ts` that becomes the canonical source for workspace paths, object routes, breadcrumbs, and deep-link builders.
- Route leaf pages for every workspace named in the roadmap: home, continuum, planning, learning, assessment, portfolio, projects & core, families, standards & practices, reports.
- Nested route families for PYP, MYP, and DP object types, for example: POI, unit, interdisciplinary unit, course map, IA tracker, TOK, EE, CAS, evidence item, family story, standards/practices evidence packet.

## Detailed implementation steps
1. Inventory every current or roadmap-planned IB destination and convert it into a canonical route table. Include teacher, coordinator, student, and guardian-facing routes where relevant.
2. Define URL rules that are stable and human-readable. Use object-first semantics: programme, school, academic year, planning context, document, evidence item, story, or review packet.
3. Ensure every dashboard widget and quick action will have a one-hop route target. If an action only makes sense in a side panel rather than a page, still define a canonical page route for deep linking and browser history.
4. Create explicit route groups for PYP, MYP, and DP instead of mixing programme objects inside generic folders. Suggested shape: `/ib/pyp/...`, `/ib/myp/...`, `/ib/dp/...`, plus shared routes like `/ib/evidence`, `/ib/families`, `/ib/reports`, `/ib/standards-practices`.
5. Define route patterns for operations objects, not just learning objects. Include approval items, moderation queues, publishing queue entries, coordinator drilldowns, and report drilldown destinations.
6. Introduce a centralized route builder utility that all cards and widgets must use. Do not hardcode route strings in many components.
7. Add breadcrumb metadata to route registry entries. Breadcrumbs should preserve programme and school context without forcing users to start over from a generic dashboard.
8. Document side-panel rules: which objects open as drawers from a list page, which deserve full-page routes, and how direct deep links reopen the same content full-screen.
9. Define modal vs drawer vs page rules. Example: quick preview may be a drawer; full review, compare view, or moderation should have a full route.
10. Add smoke tests that assert every nav item and major card destination resolves without 404s or blank pages.

## Interaction and UX requirements
- Every major IB workspace card must provide a direct action path to the most likely next task, not just a descriptive landing page.
- Back navigation should return to the exact filtered list or dashboard state when possible.
- Use stable URL segments and avoid transient labels that could change with terminology packs.
- Provide explicit empty-state CTAs on route leaves so new schools do not encounter blank workspaces with no next step.

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
- Route smoke tests for the new `/ib/**` structure.
- Navigation rendering tests to confirm role-specific IB links appear and resolve.
- Route-registry unit tests validating path builders and breadcrumb generation.
- A regression test proving generic non-IB route families still work when IB mode exists.

## Acceptance criteria
- Every IB navigation item and dashboard card resolves to a live route or an intentional placeholder with a concrete next action.
- Route patterns exist for PYP, MYP, DP, evidence, family stories, reviews, and reports.
- No new IB surface depends on hardcoded inline href strings outside the central registry.
- Browser refresh works on deep routes without losing the page or exploding due to missing context.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 02 will build the dedicated IB shell, sticky context, and work-mode behavior on top of the route map defined here.
