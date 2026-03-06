# Task 21 — Tightly Scoped AI Assistance with Diff-Based Apply

## Dependency
Complete Tasks 01–20 first.

## Objective
Constrain AI to genuinely helpful IB-side tasks that reduce workload, always show diffs, preserve teacher/coordinator control, and never become a noisy mandatory layer.

## Why this task exists now
- The roadmap is explicit that AI should stay tightly scoped and reversible, reflecting complaints that AI can add noise/work if it is too eager or too integrated.
- Existing AI surfaces in the generic product use parser-style apply flows that may not yet fit the richer IB field model.
- This task should make AI a humble assistant for high-friction writing and summarization moments, not a replacement for planning judgment.

## Toddle / ManageBac pain this task must beat
- Avoid AI-generated clutter that teachers then have to clean up.
- Avoid auto-publish or auto-apply behavior that removes teacher/coordinator control.
- Avoid embedding AI into every core action so the workflow feels slower rather than lighter.

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
- `apps/web/src/components/AiAssistantPanel.tsx`, `AiApplyModal.tsx`, and `apps/web/src/lib/ai-output-parser.ts`.
- New IB document schemas and field-aware editors from earlier tasks.
- Any AI gateway contract and task-type registry already implemented in backend/frontend.

## New or heavily modified frontend surfaces
- `apps/web/src/features/ib/ai/**` for IB-specific AI wrappers and task definitions.
- Field-aware diff presenters that understand unit/story/review objects rather than generic text chunks only.

## Detailed implementation steps
1. Restrict AI to the roadmap-approved use cases: rewrite family summary into simpler language, suggest statement-of-inquiry alternatives, summarize comment threads, suggest missing context before publish, cluster standards/practices evidence candidates, draft EE supervision summary from notes.
2. Move away from brittle heading-based output parsing when inside IB surfaces. Use schema- and field-aware structures so AI suggestions map cleanly to the relevant document fields or summaries.
3. Always show a diff or structured proposed change set before applying anything. The user must be able to accept some changes, reject others, or dismiss the suggestion entirely.
4. Never auto-publish, auto-send, or silently overwrite live document content.
5. Keep AI invocation optional and clearly labeled. Do not inject AI prompts into every field by default.
6. Add provenance markers so users know which content came from AI suggestion vs human authored work if that matters in context.
7. Support summarization of comment/review threads to reduce coordinator and advisor overhead without replacing the underlying comments.

## Interaction and UX requirements
- AI entry points should appear where friction is real, not as general decoration.
- The diff view should be simple enough to trust quickly.
- Users should never feel forced to negotiate with AI to do basic work.

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
- Diff rendering tests for field-aware AI suggestions.
- Apply/reject path tests.
- Regression tests ensuring no auto-publish or silent overwrite behavior exists.

## Acceptance criteria
- AI is limited to well-defined, helpful tasks.
- Every AI suggestion is reviewable via diff before apply.
- Core workflows remain fully usable without touching AI.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 22 and Task 23 will ensure AI additions do not degrade performance, reliability, or release quality.
