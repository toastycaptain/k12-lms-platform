# Task 17 — Approval, Moderation, and Quality Review Workflows

## Dependency
Complete Tasks 01–16 first.

## Objective
Formalize structured review across units, publishing, moderation, and DP core processes with coordinator inboxes, document-tied comments, checklists, batch actions, and approval timelines.

## Why this task exists now
- The roadmap says schools need more than publish; they need structured review and clear visibility into what is waiting, incomplete, risky, or ready.
- Legacy systems often become painful here because review states disappear into emails, comments are detached from the work, or coordinators must open items one by one.
- This task is where the platform starts to feel like decision support rather than bureaucracy.

## Toddle / ManageBac pain this task must beat
- Avoid email-like side channels for approval feedback.
- Avoid single-item-at-a-time coordinator work when batch action is safe and expected.
- Avoid generic publish buttons that hide missing prerequisites and review history.

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
- Workflow bindings and approval queue surfaces from completed backend/frontend Route 3 work.
- Coordinator summary and operations center from Tasks 04 and 14.
- Unit studios, publishing queue, and DP core flows that need embedded review state.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/review/page.tsx` or approval inbox route.
- `apps/web/src/features/ib/review/ApprovalInbox.tsx`.
- `apps/web/src/features/ib/review/MissingBeforePublishChecklist.tsx`.
- `apps/web/src/features/ib/review/DocumentApprovalTimeline.tsx`.
- `apps/web/src/features/ib/review/BatchReviewActions.tsx`.

## Detailed implementation steps
1. Design an approval inbox that can aggregate units, family stories, moderation tasks, and DP milestone reviews into role-appropriate queues. Keep filters explicit: programme, type, status, owner, due date, risk.
2. Build a 'missing before publish' checklist that is contextual to the object type. A PYP unit may have different readiness expectations than a family story or an MYP moderation item.
3. Support batch publish / batch return with notes where safe. Batch actions must preview scope and preserve item-level comments/history.
4. Keep review comments tied directly to fields or artifacts whenever possible, and summarize them in the queue without losing anchor context.
5. Add approval timeline/history to the document itself so teachers understand what happened, when, and why a return or approval occurred.
6. Implement MYP assessment moderation patterns and DP IA/EE/TOK review actions as queue-compatible flows rather than one-off pages.
7. Ensure coordinators can move through the next waiting item quickly from the queue, with one-click progression to the next review target.

## Interaction and UX requirements
- Review UI should feel like triage and support, not punishment.
- Checklists should explain the issue and link to fix it, not merely say 'incomplete'.
- Batch actions should feel safe and transparent.

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
- Queue filtering and batch-action tests.
- Checklist state tests across multiple object types.
- Approval timeline rendering tests.

## Acceptance criteria
- Teachers can see exactly what is waiting, returned, or approved and why.
- Coordinators can review efficiently with queue and batch patterns.
- Review history is visible on the object itself, not hidden in a separate tool.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 18 will surface review and risk patterns in reports; Task 21 may later summarize review threads via tightly scoped AI.
