# Task 06 — PYP Weekly Flow, Publish Readiness, Action, and Exhibition Extensions

## Dependency
Complete Task 05 first.

## Objective
Deepen the PYP unit environment with weekly-flow operational tools, compare/history utilities, quick-add patterns, family/publish readiness support, action capture, and exhibition-adjacent planning flows.

## Why this task exists now
- The roadmap specifically calls for weekly flow mapped to evidence moments, quick add patterns, compare-to-last-year, day-by-day class conversion, and mobile edits for action/family/evidence notes.
- PYP teachers need more than a static unit frame; they need practical day-to-day flow without losing the transdisciplinary structure.
- This is also where family visibility and publish cadence start to become operational rather than conceptual.

## Toddle / ManageBac pain this task must beat
- Avoid forcing teachers to bounce between the unit studio, a separate lesson planner, and a separate family feed.
- Avoid over-structuring the weekly view into a rigid timetable that kills inquiry flexibility.
- Avoid adding publish-readiness bureaucracy that feels like another checklist detached from the real work.

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
- Outputs of Task 05.
- Any existing generic lesson planning or calendar/week views under `apps/web/src/app/plan/calendar` or `teach` to reuse layout patterns carefully.
- Portfolio/evidence APIs and whatever family-preview/publishing primitives already exist.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/pyp/PypWeeklyFlowBoard.tsx`.
- `apps/web/src/features/ib/pyp/PypPublishReadinessPanel.tsx`.
- `apps/web/src/features/ib/pyp/PypActionCapture.tsx` and, if needed, `PypExhibitionWorkspace.tsx` or exhibition route scaffolding.
- Quick-add drawers for provocation, checkpoint, evidence capture, home prompt, and reflection prompt.

## Detailed implementation steps
1. Implement a weekly-flow board that supports flexible inquiry sequencing. Weeks should support rich blocks such as provocations, mini-inquiries, checkpoints, evidence moments, reflection prompts, and home connections.
2. Allow teachers to convert a week into a more granular day-by-day class view without duplicating the underlying unit content. Preserve a clear relationship between weekly narrative and daily instances.
3. Embed evidence moments directly inside weekly flow blocks so teachers can see where evidence capture belongs. These anchors should connect to the evidence inbox built later.
4. Add quick-add patterns for the highest-frequency PYP actions: provocation, checkpoint, evidence capture, family/home prompt, action reflection, and specialist collaboration note.
5. Implement compare-to-last-year or compare-to-previous-version view, emphasizing changed weeks, removed evidence moments, and updated family supports.
6. Make publish readiness actionable. The readiness panel should show which required or recommended elements are missing, which are only incomplete for family preview, and what coordinator comments still block publishing.
7. Add family window preview access from weekly-flow blocks where home connections exist, so teachers can verify tone and cadence without leaving the flow.
8. Create action capture UI that allows teachers to record and route visible student action moments without needing to finish a whole story or report immediately.
9. If exhibition routes already exist in the roadmap or previous IB pack, scaffold them now so PYP exhibition planning does not sit completely outside the PYP programme experience.
10. Support a compact mobile entry pattern for high-value note additions: evidence note, family/home note, action note, and quick publish decision.

## Interaction and UX requirements
- The weekly view must feel lighter and faster than a traditional lesson planner.
- Publish-readiness warnings should be contextual and specific, not generic scolding banners.
- Quick add should reduce typing friction and preserve transdisciplinary context automatically.

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
- Weekly-flow rendering and quick-add tests.
- Compare/history smoke tests.
- Publish-readiness edge-case tests: missing family context, missing specialist contribution, missing evidence linkage, coordinator return notes.

## Acceptance criteria
- PYP weekly flow is operational, not static.
- Evidence moments, family/home prompts, and action capture are embedded in the weekly view.
- Publish readiness is visible and actionable from within the unit flow.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Tasks 12 and 13 will plug the evidence and family queue systems into these anchors. Task 15 will govern these units at the programme level.
