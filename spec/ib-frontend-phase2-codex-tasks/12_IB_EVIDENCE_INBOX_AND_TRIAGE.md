# Task 12 — Build the Evidence Inbox and Triage Workflow

## Dependency
Complete Tasks 01–11 first.

## Objective
Create a true evidence operations model with inbox, batch actions, lightweight tagging, reflection requests, linking, family-story composition, and compact mobile triage.

## Why this task exists now
- The roadmap identifies evidence as one of the clearest opportunities to beat both Toddle and ManageBac.
- Current evidence direction is promising but still prototype-like. The next phase must make it practical: fast review, light tagging, safe routing to family visibility, and reuse across stories, reports, and evaluation evidence.
- Evidence should become the most practical part of the platform, not just a showcase gallery.

## Toddle / ManageBac pain this task must beat
- Avoid slow, click-heavy evidence validation and over-mandatory tagging.
- Avoid forcing teachers to choose between an internal portfolio inbox and a separate publishing system with duplicated content.
- Avoid making evidence triage desktop-only.

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
- Any existing portfolio pages or evidence hooks; the roadmap mentions locally seeded evidence/story data that must be replaced.
- Tasks 05–11 where evidence anchors now exist in unit and project/core flows.
- Document, family publishing, and standards/practices link APIs if available.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/evidence/page.tsx` and optional nested routes for individual evidence items.
- `apps/web/src/features/ib/evidence/EvidenceInbox.tsx`.
- `apps/web/src/features/ib/evidence/EvidenceReviewDrawer.tsx`.
- `apps/web/src/features/ib/evidence/BatchEvidenceActions.tsx`.
- `apps/web/src/features/ib/evidence/EvidenceToStoryComposer.tsx`.
- `apps/web/src/features/ib/evidence/MobileEvidenceTriage.tsx`.

## Detailed implementation steps
1. Separate the evidence inbox from the polished portfolio showcase. Inbox is for work-in-progress triage; portfolio is for curated long-term visibility.
2. Define evidence statuses and triage actions clearly: new, needs teacher validation, needs student reflection, linked to story draft, family visible, held internal, linked to evaluation evidence, etc.
3. Add batch actions for validate, request reflection, assign visibility, add to story draft, and link to unit/project/core/standards evidence. Batch operations must preview their effect and support undo where reasonable.
4. Implement progressive tagging. Collect only the minimum required metadata upfront, then suggest richer tags contextually when the teacher is already engaged with the item.
5. Create side-by-side evidence + story composer mode so teachers can pull evidence into family-facing narrative without copying data between screens.
6. Add missing-context warnings before an item can become family-visible. These warnings should explain what context is absent, not simply block publication mysteriously.
7. Provide a compact mobile triage view for evidence validation, reflection requests, quick visibility decisions, and simple notes.
8. Make the inbox filterable by programme, class/planning context, contributor type, visibility state, and queue type (teacher, coordinator, specialist, family-ready).

## Interaction and UX requirements
- Triage must be fast and forgiving. The UI should make it easy to do the obvious next action.
- Tagging should feel assistive, not like a tax.
- Evidence cards should show just enough context to avoid opening each item unnecessarily.

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
- Evidence status and batch-action tests.
- Mobile triage interaction tests.
- Composer integration tests linking evidence to stories and internal references.

## Acceptance criteria
- Evidence has an operational inbox with clear statuses and batch actions.
- Teachers can route evidence to stories, reflections, and internal links without duplicating work.
- Compact mobile triage supports the highest-value evidence actions.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 13 will formalize family publishing on top of the evidence operations model built here.
