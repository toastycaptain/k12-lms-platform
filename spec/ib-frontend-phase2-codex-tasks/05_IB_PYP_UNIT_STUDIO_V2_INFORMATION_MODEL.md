# Task 05 — PYP Unit Studio v2: Information Model, Layout, and Live Document Wiring

## Dependency
Complete Tasks 01–04 first.

## Objective
Transform the PYP Unit Studio from a static or parallel bespoke surface into a live curriculum-document-backed working environment built around transdisciplinary planning, specialist contribution, family preview, and publish readiness.

## Why this task exists now
- The roadmap calls the PYP studio a strong static representation that now needs to become a true 'unit cockpit'.
- This is the point where the IB-specific UI must stop floating separately from the curriculum document engine and become the real source of truth.
- PYP is the fastest place to show that the platform understands the IB beyond terminology changes: transdisciplinary structure, family windows, action, and specialist collaboration must feel native.

## Toddle / ManageBac pain this task must beat
- Avoid Toddle-like click-heavy tab changes when switching between unit framing, weekly flow, evidence, and family visibility.
- Avoid the legacy pattern where teachers must edit one form for persistence and a separate prettier surface for presentation.
- Avoid hiding specialist contributions or publish blockers in secondary tabs that homeroom teachers forget to check.

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
- Any schema-driven planner/editor work completed in the prior frontend track.
- Backend curriculum document routes and document-schema contracts for PYP unit document types.
- Any early IB prototype components or prior roadmap task outputs that may already contain layout patterns worth preserving.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/pyp/units/[unitId]/page.tsx` or the canonical PYP unit route defined in Task 01.
- `apps/web/src/features/ib/pyp/PypUnitStudioV2.tsx`.
- Subcomponents for Overview, Inquiry, Weekly Flow, Evidence, Collaboration, Family Preview, and Publish Status panels.
- Document adapter layer converting curriculum document payloads into PYP-specific studio state while preserving the underlying schema structure.

## Detailed implementation steps
1. Define the canonical PYP unit information architecture around the actual document model: unit identity, transdisciplinary theme, central idea, lines of inquiry, learner profile/ATL emphases as applicable, weekly flow, evidence moments, family-facing preview, specialist contributions, publish status, and history.
2. Wire the studio directly to the curriculum document engine rather than local-only mock state. Use the completed backend/frontend document APIs and schema system as the single source of truth.
3. Create a layout that supports deep work: primary content column, contextual side inspector, compact progress/navigation rail, and sticky action bar for save/review/publish readiness.
4. Implement collapsible sections with persisted expansion state. Teachers should be able to work in a narrow slice of the unit without losing where they are next time.
5. Add inline comments attached to fields or content blocks, not just document-level comments. This is critical for coordinator guidance and specialist collaboration.
6. Surface specialist contribution lane visibly in the studio rather than burying it. The homeroom teacher should see contributions present, missing, pending, or needing response.
7. Add family-preview access from within the studio so teachers can check how unit language appears externally without leaving the editing context.
8. Display publish-readiness chips and missing-before-publish indicators directly in the unit header. Missing states should be actionable links, not passive warnings.
9. Support unit-history and compare-to-last-year entry points in the shell, even if full compare tooling comes in Task 06.
10. Design Meeting mode behavior now: if the unit is opened in meeting mode, the studio should present sections optimized for collaborative review rather than solo editing.

## Interaction and UX requirements
- Keep the studio visibly transdisciplinary. Do not let it degrade into a generic lesson-plan form with IB labels pasted on top.
- A teacher should be able to see progress, blockers, and collaborator activity without opening three different tabs.
- Persist context aggressively: section open/closed state, scroll anchors, selected week, active comment thread.

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
- Integration tests for loading a PYP curriculum document into the studio and saving changes back out.
- Comment-anchor tests and publish-readiness state tests.
- Role tests for homeroom teacher vs specialist vs coordinator visibility within the studio.

## Acceptance criteria
- The PYP Unit Studio is driven by live curriculum document data, not a separate mock model.
- Inline comments, specialist lane, family preview access, and publish status are first-class parts of the layout.
- The studio supports planning, review, and meeting contexts without duplicating the document.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 06 extends this studio into weekly-flow micro-workflow, compare history, mobile quick edits, and family/publish operations.
