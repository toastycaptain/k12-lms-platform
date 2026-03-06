# Task 08 — MYP Interdisciplinary Planning, Service as Action, and Project Links

## Dependency
Complete Task 07 first.

## Objective
Add the shared-ownership and action workflows MYP teachers and coordinators need: interdisciplinary pairing, service-as-action visibility, criterion/evidence matrix operations, and links from units to projects.

## Why this task exists now
- The roadmap calls for an interdisciplinary pairing panel with shared planning owner states, service as action that is not buried, a criterion/evidence matrix, and a unit-to-project relationship map.
- These are high-friction areas in many LMSs because they cross subject or ownership boundaries.
- This task also helps specialists and coordinators by making shared planning visible and operable instead of implied.

## Toddle / ManageBac pain this task must beat
- Avoid burying interdisciplinary ownership in a sub-tab few teachers revisit.
- Avoid making service as action a compliance afterthought disconnected from the unit timeline.
- Avoid forcing teachers to duplicate evidence anchors between units, criteria tables, and project trackers.

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
- Outputs of Task 07.
- Workflow APIs and planning-context models for shared/interdisciplinary contexts.
- Any project-related or portfolio components that can be reused.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/myp/InterdisciplinaryPanel.tsx`.
- `apps/web/src/features/ib/myp/ServiceAsActionPanel.tsx`.
- `apps/web/src/features/ib/myp/CriterionEvidenceMatrix.tsx`.
- `apps/web/src/features/ib/myp/ProjectRelationshipMap.tsx`.

## Detailed implementation steps
1. Build an interdisciplinary pairing panel that makes ownership explicit: lead teacher, partner teacher(s), status, blockers, next action, and shared document links.
2. Support subject-teacher vs interdisciplinary-lead views with filters or mode toggles. The same unit should not feel impossible to navigate depending on role.
3. Create a criterion/evidence matrix that lets teachers drag or remap evidence moments to criteria without duplicating entries. Keep the matrix aligned to the live unit structure from Task 07.
4. Surface service-as-action opportunities or records directly in the unit flow, not in a disconnected side feature. Show whether opportunities are planned, active, evidenced, or awaiting student reflection.
5. Add a unit-to-project relationship map so personal/community project or related project workflows can be seen in relation to regular units. Keep the relationship meaningful, not decorative.
6. Ensure interdisciplinary and service/project elements affect publish/readiness and coordinator visibility where appropriate.
7. Make quick comment and quick status changes possible from this panel so cross-subject collaboration does not always require full-page editing.

## Interaction and UX requirements
- Shared ownership must be instantly visible; unclear responsibility is one of the most demoralizing coordination problems in school software.
- The matrix should support fast reassignment without spreadsheet-like fragility.
- Service as action should feel connected to learning, not hidden compliance metadata.

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
- Shared-ownership rendering tests.
- Criterion/evidence matrix interaction tests.
- Service/project linkage smoke tests.

## Acceptance criteria
- Interdisciplinary planning is visible, owned, and actionable.
- Service as action is embedded in the unit experience.
- Teachers can map evidence to criteria efficiently and see project relationships clearly.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 11 on specialist mode and Task 17 on review workflows will rely on the ownership and matrix mechanics introduced here.
