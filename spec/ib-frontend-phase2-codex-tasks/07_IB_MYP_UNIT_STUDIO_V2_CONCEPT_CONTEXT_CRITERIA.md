# Task 07 — MYP Unit Studio v2: Concepts, Context, Statement of Inquiry, and Criteria

## Dependency
Complete Tasks 01–06 first.

## Objective
Operationalize the MYP unit studio as a live, concept- and criteria-driven environment where statement of inquiry, global context, inquiry questions, ATL, and assessment planning are easier to manage than spreadsheets or generic forms.

## Why this task exists now
- The roadmap says the MYP studio should make conceptual planning feel easier than a spreadsheet.
- MYP is where many generic LMSs feel least native because concept/context/criteria relationships are awkward to express in traditional lesson-plan schemas.
- A strong MYP studio is essential to demonstrate that the platform understands IB conceptual planning rather than just offering a standards form with renamed labels.

## Toddle / ManageBac pain this task must beat
- Avoid burying global context, key/related concepts, ATL, and criteria in separate tabs with weak connections.
- Avoid forcing teachers to construct statement-of-inquiry logic in plain text boxes with no guidance or preview.
- Avoid making rubric or criterion balance an afterthought only visible during assessment, not planning.

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
- Any completed schema-driven document editor and Task 05 PYP wiring patterns.
- Backend MYP document schemas, framework bindings, workflow bindings, and current frontend generic planner surfaces.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/myp/units/[unitId]/page.tsx` or canonical MYP unit route.
- `apps/web/src/features/ib/myp/MypUnitStudioV2.tsx`.
- Subcomponents for statement-of-inquiry builder, concept/context panel, inquiry question set editor, criterion balance bar, ATL prompt layer, and rubric/rehearsal preview.

## Detailed implementation steps
1. Define the MYP unit studio header around the key planning object relationships: title, year/subject, global context, key concept, related concepts, statement of inquiry, inquiry questions, ATL focus, criteria, and linked assessments or projects.
2. Wire the studio directly to curriculum document data and workflows. Do not introduce an MYP-only parallel persistence model.
3. Build a statement-of-inquiry composer with live preview and helpful feedback panels. This should explain the relationship between concept, context, and the statement without becoming AI-heavy or overbearing.
4. Surface criterion balance and timing inside the unit header or side panel. Teachers should immediately see if the unit overweights or underrepresents certain criteria or lacks evidence anchors.
5. Provide ATL prompts or usage indicators that help teachers see under-used strands without turning the studio into a compliance checklist.
6. Implement inquiry-question editing in a way that connects factual, conceptual, and debatable questions, using structured cards rather than one long text blob.
7. Add assessment rehearsal / rubric preview mode so a teacher can see how criteria will feel from the student perspective before publication.
8. Support compare side-by-side view for two unit versions, especially useful when coordinators or departments refine conceptual framing.
9. Keep interdisciplinary hooks visible but do not fully implement them here; Task 08 will expand shared ownership, service as action, and project links.

## Interaction and UX requirements
- Make concept/context relationships legible at a glance.
- Avoid overwhelming the teacher with too many fields at once; use grouped cards with clear logic.
- The studio should feel more like a planning conversation and less like data entry.

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
- Render/save tests for MYP concept/context fields.
- Statement-of-inquiry builder tests, including empty/invalid states and comparison flows.
- Criterion-balance calculation tests if computed client-side.

## Acceptance criteria
- MYP unit studio is live-document-backed and concept-driven.
- Statement of inquiry, inquiry questions, ATL focus, and criteria are integrated parts of the planning experience.
- Teachers can assess criterion balance and preview assessment logic without leaving the studio.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 08 extends this with interdisciplinary planning, service as action, and project link workflows.
