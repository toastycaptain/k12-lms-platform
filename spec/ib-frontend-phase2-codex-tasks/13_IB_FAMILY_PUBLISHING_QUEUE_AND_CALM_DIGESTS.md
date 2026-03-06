# Task 13 — Family Publishing Queue, Digest Scheduling, and Calm-Mode Output

## Dependency
Complete Task 12 first.

## Objective
Turn family visibility into a deliberate, low-noise publishing workflow with queue states, previews, digest cadence, translation/reading-level preview, and over-posting safeguards.

## Why this task exists now
- The roadmap is explicit that family visibility should not feel like a noisy social feed.
- The platform should beat Toddle’s 'constant stream' feeling by giving teachers and coordinators more intentional control over cadence and tone.
- This task also protects families from being overwhelmed while still keeping the school transparent and connected.

## Toddle / ManageBac pain this task must beat
- Avoid a firehose feed where every evidence item feels like a possible post.
- Avoid ambiguous publishing states that leave teachers unsure whether something is visible, scheduled, or blocked.
- Avoid family preview flows that require leaving the teacher context or guessing what will actually be seen.

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
- Outputs of Task 12.
- Any existing guardian/family communication routes under `guardian` or `communicate`.
- Translation, notification, and writing-guidance patterns if present elsewhere in the app.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/families/publishing/page.tsx` or queue route.
- `apps/web/src/features/ib/families/PublishingQueue.tsx`.
- `apps/web/src/features/ib/families/StoryStatePill.tsx`.
- `apps/web/src/features/ib/families/FamilyPreviewPanel.tsx`.
- `apps/web/src/features/ib/families/DigestScheduler.tsx`.

## Detailed implementation steps
1. Define explicit publishing states: draft, needs context, ready for digest, publish now, scheduled, published, held back intentionally. Use these consistently across evidence inbox, unit studio, and family views.
2. Create a publishing queue where teachers can see what is ready, blocked, scheduled, or recently sent. The queue should support filtering by programme, class, author, story type, and audience.
3. Provide a clear family preview that renders exactly what guardians will see, with permission-safe wording and any translation or reading-level preview if multilingual support exists or is planned.
4. Show what has already been shared recently so teachers do not over-post or repeat themselves unintentionally.
5. Support digest scheduling and quiet publishing cadence. Teachers should be able to queue several items for a calmer digest rather than being pushed toward immediate posting every time.
6. Add in-context school-level writing guidance: tone, privacy reminders, and family communication expectations. Keep guidance supportive, not bureaucratic.
7. Make publishing controls explicit and reversible where possible. Teachers should know whether a notification will go out, when, and to whom.
8. Ensure coordinators can oversee publishing cadence at a summary level without editing every story directly.

## Interaction and UX requirements
- The queue must feel calmer than a social feed and more intentional than a message center.
- Preview is non-negotiable; teachers should never publish blind.
- Use clear state language and avoid ambiguous badges like 'done' or 'sent' without detail.

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
- State-transition tests for stories in the queue.
- Preview rendering tests.
- Digest scheduling tests, including over-posting guardrails and notification previews.

## Acceptance criteria
- Family publishing is a deliberate queue with explicit states and previews.
- Teachers can schedule or hold items to preserve calm cadence.
- The queue integrates with evidence and unit flows rather than requiring duplicate content creation.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Tasks 14, 18, and 19 will use publishing data for coordinator oversight, reporting, and guardian calm-mode refinement.
