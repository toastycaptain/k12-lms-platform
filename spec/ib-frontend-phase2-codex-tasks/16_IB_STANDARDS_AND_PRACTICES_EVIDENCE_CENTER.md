# Task 16 — Standards & Practices Evidence Center

## Dependency
Complete Tasks 01–15 first.

## Objective
Turn Standards & Practices from a placeholder board into a serious evaluation-prep and governance environment where evidence grows naturally out of daily work and can be reviewed, strengthened, and exported.

## Why this task exists now
- The roadmap names this as a major coordinator/admin opportunity.
- Schools need a place to map daily artifacts, policies, stories, comments, reports, and curriculum documents to standards/practices evidence without building a parallel evidence binder manually.
- This is a key place to outgrow ManageBac’s reputation for administrative heaviness by making evidence emerge from normal work rather than duplicated upload labor.

## Toddle / ManageBac pain this task must beat
- Avoid a static kanban or document dump that still requires schools to maintain separate evaluation spreadsheets.
- Avoid evidence repositories detached from live planning, comments, or family/publishing artifacts.
- Avoid losing historical review cycles or who said what about evidence strength.

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
- Any existing standards & practices board or report prototypes.
- Tasks 05–15 where evidence-producing work now exists.
- Export/report patterns, attachment/link patterns, and workflow/comment primitives.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/standards-practices/page.tsx` and nested routes as needed.
- `apps/web/src/features/ib/standards-practices/EvidenceCenter.tsx`.
- `apps/web/src/features/ib/standards-practices/EvidenceMappingScreen.tsx`.
- `apps/web/src/features/ib/standards-practices/ReviewDrawer.tsx`.
- `apps/web/src/features/ib/standards-practices/ExportPackBuilder.tsx`.
- `apps/web/src/features/ib/standards-practices/AuditTrailView.tsx`.

## Detailed implementation steps
1. Represent standards/practices in navigable strands/indicators or the equivalent structure used by the backend contracts. Do not flatten everything into a single list.
2. Allow evidence items to link to live source objects: curriculum documents, comments, evidence items, family stories, policies, reports, project/core artefacts, and other relevant records.
3. Show owner, due date, review status, confidence/strength, and notes per evidence item. Weak evidence must be visible, not hidden in a note field.
4. Add 'needs stronger evidence' or equivalent flags and route them to concrete next steps or owners.
5. Support historical evidence cycles so schools can see what was used in prior review periods without confusing it with the current cycle.
6. Create export packet preparation flow that can assemble selected evidence into coherent bundles without requiring manual copy/paste from many screens.
7. Provide a review drawer with timeline, notes, attachments, and quick owner/status changes. Keep the review conversation attached to the evidence item.
8. Expose audit trail showing what was linked, reviewed, changed, or exported, by whom and when.

## Interaction and UX requirements
- The evidence center should feel like a living governance tool, not an archive.
- Users should always understand the relationship between a piece of evidence and the live work it came from.
- Export flows should be structured and calm, not another stressful scavenger hunt.

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
- Evidence-link rendering tests for multiple source object types.
- Review state and audit-trail tests.
- Export packet builder smoke tests.

## Acceptance criteria
- Standards & Practices evidence is organized, reviewable, and linked to live school work.
- Weak evidence and ownership gaps are easy to identify and address.
- Historical cycles and export packets are supported without losing provenance.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 17 will wire approvals and moderation more deeply; Task 18 will surface standards/practices gaps in reporting and operations center contexts.
