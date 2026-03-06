# Task 04 — Build the Coordinator Home and Oversight Summary

## Dependency
Complete Tasks 01–03 first.

## Objective
Create a home-level IB coordinator/admin summary that surfaces programme health, exceptions, approvals, evidence readiness, and family-publishing cadence before the full Programme Operations Center is built.

## Why this task exists now
- The roadmap notes that the current admin surfaces are too generic and not yet 'IB coordinator-grade'.
- Coordinators need a different home experience than teachers: exception-first oversight, approval visibility, health summaries, and fast drill-down into the specific item requiring action.
- This task seeds the coordinator mental model before deeper tools in later tasks (Programme Operations Center, POI governance, Standards & Practices evidence, review queues).

## Toddle / ManageBac pain this task must beat
- Avoid generic admin dashboards that show totals without exposing the document or queue entry that needs action.
- Avoid forcing coordinators to open separate tools for PYP, MYP, DP, and family oversight just to identify what is overdue.
- Avoid noisy dashboards that surface every metric equally; prioritize risk, blockers, and pending decisions.

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
- Existing admin dashboard, approval queue, standards pages, and district pages for data and layout patterns worth reusing or replacing.
- Any existing workflow state and evidence queue APIs exposed by the completed backend work.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/home/CoordinatorOverview.tsx`.
- Role-specific widget composition for PYP Coordinator, MYP Coordinator, DP Coordinator, and whole-school IB leader / Head of School.
- Drill-down adapters that convert summary widgets into the deeper routes created later in Tasks 14–18.

## Detailed implementation steps
1. Define coordinator-home widget groups: programme health, overdue/incomplete items, approvals awaiting action, family publishing cadence, evidence queue health, standards/practices evidence completeness, and team support needs.
2. For PYP, include early visibility into POI gaps, specialist contribution omissions, and units blocked before publish.
3. For MYP, include criterion coverage imbalance, interdisciplinary draft status, moderation or rubric-review issues, and service-as-action follow-up.
4. For DP, include IA risk, EE/TOK/CAS follow-up, supervisor workload hotspots, and student milestone exceptions.
5. For whole-school IB leadership, include a cross-programme summary plus school-level publishing rhythm, evaluation evidence readiness, and teams needing support.
6. Use compact cards with clear action language and numeric/contextual status. Every card must deep-link into an actual queue, workspace, or report.
7. Provide filtering by school, programme, academic year, and status without hiding the most important exception cards.
8. Support coordinator-specific work mode defaults from Task 02 so this dashboard can open in review mode and preserve its filters.
9. Keep this page intentionally focused. It is a home-level summary, not the full Programme Operations Center; resist adding giant tables here.

## Interaction and UX requirements
- The coordinator should be able to identify the top three issues in under 10 seconds.
- Use color and badges responsibly: risk states must be perceivable without relying only on hue.
- Provide terse explanatory text so coordinators know why something appears in the summary.

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
- Role-based rendering tests for PYP/MYP/DP coordinator variants.
- Drill-down link tests.
- Smoke tests for filter state persistence and empty states.

## Acceptance criteria
- Coordinator home shows exceptions and pending decisions, not just totals.
- Different coordinator roles see relevant programme-specific cards.
- Every summary card opens a real queue, document, or report destination.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Tasks 14–18 will deepen coordinator power tools. This page should then become the entry summary rather than trying to hold every feature itself.
