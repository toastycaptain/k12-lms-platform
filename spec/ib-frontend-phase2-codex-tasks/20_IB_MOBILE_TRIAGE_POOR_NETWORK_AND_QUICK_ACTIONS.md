# Task 20 — Mobile Triage, Poor-Network Behavior, and High-Value Quick Actions

## Dependency
Complete Tasks 01–19 first.

## Objective
Optimize the IB experience for the high-value teacher/coordinator actions that happen on mobile or in low-connectivity conditions without chasing full desktop parity.

## Why this task exists now
- The roadmap explicitly says to build mobile for high-value teacher tasks rather than total parity, and to include offline/poor-network design for core mobile actions.
- This is a direct response to public complaints about laggy or weak mobile educator workflows in competing tools.
- Now that core teacher/coordinator flows exist, the product needs a pragmatic mobile layer for triage, not just responsive shrinkage.

## Toddle / ManageBac pain this task must beat
- Avoid squeezing giant desktop studios into tiny screens.
- Avoid making simple approval, evidence, or visibility actions impossible on a phone.
- Avoid silent data loss when connectivity drops during a busy school day.

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
- Tasks 03, 12, 13, 17, and 19 where the highest-value mobile actions live.
- Existing offline queue, SWR retry behavior, and connectivity banner components.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/mobile/**` for reusable mobile-specific wrappers or drawers.
- Compact variants for evidence triage, review queue actions, family visibility changes, coordinator approval quick actions, and today’s queue cards.

## Detailed implementation steps
1. Audit every IB workflow and identify the truly high-value mobile actions: comment, approve, validate evidence, change visibility, review student milestone, send or schedule family-ready summary, check today’s queue, and capture quick notes.
2. Create mobile-optimized surfaces for those actions, using bottom sheets, stacked cards, or compact drawers rather than desktop layouts compressed down.
3. Integrate with connection banner/offline mutation queue behavior so users understand when a change is pending, saved, retried, or blocked.
4. Design poor-network states deliberately: lightweight skeletons, optimistic status where safe, explicit retry, and avoidance of giant payload fetches for triage views.
5. Preserve click budgets on mobile. A high-value action should still be fast even with one hand and limited attention.
6. Document which desktop-only functions remain intentionally desktop-first and why. This prevents scope creep into unusable pseudo-parity.

## Interaction and UX requirements
- Mobile should feel like a triage console, not a compromised desktop clone.
- Always show save/pending state clearly on mobile.
- Touch targets, spacing, and scroll behavior must support rushed real-world use.

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
- Responsive layout tests for key mobile triage routes.
- Offline/pending mutation tests where applicable.
- Quick-action regression tests on small viewport widths.

## Acceptance criteria
- The highest-value IB teacher/coordinator actions are workable on mobile.
- Poor-network behavior is explicit and resilient.
- The product does not pretend to offer desktop parity where it would degrade usability.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 22 will harden performance/reliability more broadly, but mobile triage must already respect route-load and mutation-cost constraints.
