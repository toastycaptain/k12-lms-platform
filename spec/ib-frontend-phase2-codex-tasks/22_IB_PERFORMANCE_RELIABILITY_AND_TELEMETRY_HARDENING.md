# Task 22 — Performance, Reliability, Autosave, and Telemetry Hardening

## Dependency
Complete Tasks 01–21 first.

## Objective
Prevent the IB experience from inheriting the laggy or fragile reputation users complain about elsewhere by enforcing route-load budgets, resilient autosave, local draft safety, conflict handling, telemetry, and clear loading/error behavior.

## Why this task exists now
- The roadmap makes a dedicated performance/reliability pass a full workstream.
- Once the product becomes operations-heavy, slow route changes, fragile saves, or unclear loading states will quickly erase any UX advantage over Toddle or ManageBac.
- This task turns reliability into a designed system rather than an afterthought.

## Toddle / ManageBac pain this task must beat
- Avoid sluggish heavy routes with many data panels rendering at once.
- Avoid autosave that appears magical until it conflicts or drops changes silently.
- Avoid spinners everywhere with no skeletons, no progress context, and no telemetry trail when something degrades.

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
- Existing Web Vitals reporting, SWR/offline mutation queue, connection banner, and performance docs in the repo.
- All earlier IB routes, especially operations center, studios, evidence inbox, and publishing queue.

## New or heavily modified frontend surfaces
- IB-specific telemetry hooks where needed under `apps/web/src/features/ib/core/**` or `apps/web/src/lib/**`.
- Route-level performance budgets and instrumentation notes.
- Autosave/status components reusable across studios and queues.

## Detailed implementation steps
1. Define route-load budgets for major IB routes: home, unit studio, evidence inbox, publishing queue, operations center, standards/practices, DP core. Use real metrics rather than vague expectations.
2. Instrument the new IB routes with performance telemetry and identify the heaviest data composition points. Defer, stream, paginate, or lazily load where appropriate.
3. Standardize loading states: use skeletons for page regions, not generic spinners only. Make loading states reflect the structure of the eventual content.
4. Implement clear autosave status and conflict handling in editing surfaces. Teachers should know if a save is pending, succeeded, failed, or conflicted, and what to do next.
5. Add local draft resilience where appropriate so long-form entries or notes are not lost to refresh or connectivity issues.
6. Define retry and stale-data behavior for evidence queues, publishing queues, and review queues. Different workflows may need different freshness expectations.
7. Ensure route transitions and side-panel open/close flows remain snappy even when the underlying route is data-heavy.

## Interaction and UX requirements
- Performance affordances should reassure the user; they should never feel blind while waiting.
- Autosave must communicate clearly without becoming visual noise.
- Reliability features are part of trust, not purely engineering hygiene.

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
- Performance smoke benchmarks where possible in CI or documented manual test scripts.
- Autosave/conflict state tests.
- Loading/error/offline state tests for the heaviest IB routes.

## Acceptance criteria
- Major IB routes have explicit performance and loading strategies.
- Autosave and local draft behavior are visible and trustworthy.
- Telemetry exists to detect regressions after release.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 23 will codify release gates, click budgets, and QA discipline on top of this hardening work.
