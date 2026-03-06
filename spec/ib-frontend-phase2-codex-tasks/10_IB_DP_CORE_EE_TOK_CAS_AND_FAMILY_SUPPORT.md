# Task 10 — DP Core Operations: EE, TOK, CAS, Advisor Triage, and Family Support

## Dependency
Complete Task 09 first.

## Objective
Operationalize DP core workspaces so EE, TOK, and CAS become practical teacher/advisor/coordinator tools with triage views, workload visibility, draft comparison, and permission-safe family support previews.

## Why this task exists now
- The roadmap explicitly lists supervisor workload view for EE, TOK checkpoint board, CAS advisor triage inbox, family support summary preview, draft comparison, and timeline/table dual view.
- This is where legacy products often become administratively exhausting: too many disconnected pages, weak advisor workflows, and poor visibility into who needs support.
- A strong DP Core workspace can differentiate the product immediately for coordinators and advisors.

## Toddle / ManageBac pain this task must beat
- Avoid scattering EE, TOK, and CAS across unrelated route families with different interaction patterns.
- Avoid making advisor triage a spreadsheet problem that ignores context, comments, or document history.
- Avoid over-sharing sensitive student information in family preview or digest surfaces.

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
- Outputs of Task 09.
- Any existing project/core pages, approval flows, or evidence models that can be reused.
- Guardian and communication flows that may be adapted for permission-safe family support messages.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/dp/core/ee/**`, `/tok/**`, `/cas/**` route families as needed.
- `apps/web/src/features/ib/dp/DpEeSupervisorWorkspace.tsx`.
- `apps/web/src/features/ib/dp/DpTokCheckpointBoard.tsx`.
- `apps/web/src/features/ib/dp/DpCasAdvisorInbox.tsx`.
- `apps/web/src/features/ib/dp/DpFamilySupportPreview.tsx`.

## Detailed implementation steps
1. Design EE supervisor workspace around advisor workload, student status, draft chronology, review comments, and next intervention. Make it easy to pivot from a supervisor summary to a single student’s history.
2. Build TOK checkpoint board with clear milestone states, student grouping, and comment/approval actions. Avoid generic kanban for the sake of it; structure must reflect actual checkpoint needs.
3. Create CAS advisor inbox focused on triage: reflections awaiting review, missing evidence, completion risk, follow-up due, and advisor action history.
4. Add draft comparison or chronology views where they materially help, especially for EE and TOK where progress over time matters.
5. Implement permission-safe family support preview surfaces. The goal is not to expose full advisor notes, but to show what support-oriented summary could be shared when appropriate.
6. Provide bulk but controlled actions such as reminder nudges or status updates where safe and helpful. Always preview the scope and effect.
7. Ensure these core workspaces integrate with the coordinator summary and risk views built in Tasks 04 and 09.

## Interaction and UX requirements
- Advisors and supervisors should be able to work from queues and summaries, not by hunting through each student one at a time.
- Use calm, precise status language. DP core can become emotionally overloaded for staff if every state is framed as urgent.
- Family support preview must be intentionally separate from internal review notes.

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
- Core-workspace rendering tests for EE/TOK/CAS variants.
- Draft comparison and queue interaction tests.
- Permission tests around family preview visibility.

## Acceptance criteria
- DP core work is organized into advisor/supervisor-friendly triage workspaces.
- Teachers can see workload hotspots, student status, and next actions from the same workspace.
- Family support preview is permission-safe and does not leak internal notes.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 12 and Task 13 will connect evidence/publishing behavior more deeply; Task 14 will absorb DP core summaries into the Programme Operations Center.
