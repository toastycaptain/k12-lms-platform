# Task 19 — Student and Guardian Calm-Mode Refinement

## Dependency
Complete Tasks 01–18 first.

## Objective
Refine student and guardian experiences so they are coherent, useful, permission-safe, and intentionally low-noise, supporting the IB journey without copying internal teacher/coordinator complexity.

## Why this task exists now
- The roadmap calls for a dedicated calm-mode pass for student/family experiences.
- Family and student surfaces should become more supportive because teacher-facing evidence/publishing workflows are now richer and more deliberate.
- This is where the product can avoid both legacy clutter and social-feed anxiety.

## Toddle / ManageBac pain this task must beat
- Avoid exposing internal planning jargon or approval clutter to guardians.
- Avoid turning guardian view into a random chronology of posts with no learning arc.
- Avoid showing students a generic grade-centric progress screen when IB growth, evidence, projects/core milestones, and next actions matter more.

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
- `apps/web/src/app/learn/**`, `apps/web/src/app/guardian/**`, and `apps/web/src/components/StudentProgressView.tsx`.
- Outputs of Tasks 12–13 for evidence and family publishing.
- Any notification settings or communication threads already in the app.

## New or heavily modified frontend surfaces
- IB-specific student dashboard components under `apps/web/src/features/ib/student/**`.
- IB-specific guardian digest/support components under `apps/web/src/features/ib/guardian/**`.
- Optional replacement or wrapper for `StudentProgressView` when IB mode is active.

## Detailed implementation steps
1. Simplify the student dashboard around the most helpful signals: current learning blocks, evidence/reflection requests, upcoming project/core milestones, and recent teacher feedback relevant to action.
2. Refine guardian experience around digest, family support, what is being learned now, and selected published evidence/stories. Keep it permission-safe and calm.
3. Create publish preview system consistency so what teachers see in Task 13 matches what guardians actually receive here.
4. Design notification rules to reduce noise: digest summaries over constant pings, meaningful alerts over micro-events, and visibility into what was already shared.
5. Make guardian wording plain, supportive, and context-rich; do not surface internal review or draft-state language.
6. Ensure student surfaces support self-management and reflection without requiring them to parse coordinator/admin concepts.

## Interaction and UX requirements
- Students should leave the dashboard understanding what to do next, not feeling monitored by another system.
- Guardians should feel informed and connected, not overwhelmed.
- Calm-mode means fewer but better signposts.

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
- Role and permission tests for student/guardian views.
- Preview consistency tests between teacher preview and guardian rendering.
- Notification preference and digest behavior tests if the frontend owns these controls.

## Acceptance criteria
- IB student and guardian experiences are calmer and more coherent than generic versions.
- Guardian views align with family publishing logic and do not leak internal workflow details.
- Student progress/action surfaces reflect IB realities rather than generic standards/grades framing alone.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 20 focuses on mobile triage; Task 21 adds tightly scoped AI help; Task 23 will include guardian/student UAT in release gates.
