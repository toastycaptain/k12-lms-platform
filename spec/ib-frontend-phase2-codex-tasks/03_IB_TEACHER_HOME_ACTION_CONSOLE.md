# Task 03 — Replace IB Teacher Home with a Real Action Console

## Dependency
Complete Tasks 01–02 first.

## Objective
Turn the teacher-facing IB home experience into an operations console that answers 'what needs my attention now?' and lets teachers resume work, process evidence, publish, and respond to change with minimal clicks.

## Why this task exists now
- The roadmap states that teachers judge the product by daily work speed, not by how beautiful the landing page looks.
- A strong teacher action console is one of the clearest opportunities to beat Toddle and ManageBac, which often require teachers to traverse too many layers for routine work.
- This task should concentrate practical daily flow: resume cards, evidence queue, publishing queue, approval comments, project/core follow-up, and changes-since-last-visit.

## Toddle / ManageBac pain this task must beat
- Avoid a brochure dashboard made of descriptive widgets that require another 2–4 clicks before work can begin.
- Avoid cluttered analytics-first dashboards where teachers have to interpret charts before finding the action.
- Avoid separate home experiences per programme that duplicate logic; use one teacher console framework with PYP/MYP/DP-aware modules.

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
- Any existing `/dashboard` or teacher dashboard implementation.
- Notification and quick-action components that might be reused for action cards.
- Evidence, document, and workflow APIs created by prior backend/frontend work so cards can be data-backed rather than mock-driven.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/home/page.tsx` or equivalent teacher-default route.
- `apps/web/src/features/ib/home/TeacherActionConsole.tsx`.
- Modular console widgets such as `ResumeWorkCard`, `ChangeFeedCard`, `EvidenceNeedsActionCard`, `FamilyPublishingCard`, `CoordinatorCommentsCard`, `ProjectsCoreFollowUpCard`, `QuickActionsRail`.
- A data-composition hook that combines work items from documents, evidence, workflows, family publishing, and projects/core into one teacher-facing payload.

## Detailed implementation steps
1. Define the teacher console information architecture around actions, not static summaries. Core sections should include: resume current work, what changed since last visit, evidence needing action, publishing actions, coordinator feedback, project/core follow-up, and quick-create actions.
2. Implement resume cards that restore a teacher to the exact place they were editing (unit, lesson/weekly flow, evidence item, publishing queue, approval feedback thread) using route registry and sticky context from Tasks 01–02.
3. Add a change feed that highlights collaborative changes since the user’s previous visit: new coordinator comments, specialist input, updated approvals, evidence awaiting validation, upcoming project/core deadlines. Keep the feed concise and action-linked.
4. Create exception cards that emphasize blocking items, not everything in the system. Examples: '3 evidence items need family visibility decisions', '1 PYP unit blocked before publish', '2 MYP units missing interdisciplinary owner', '4 CAS reflections need advisor review'.
5. Provide one-click deep links from each card to the specific working surface, ideally opening the relevant drawer or full page directly.
6. Support compact and expanded layouts so the same console works on laptop and tablet widths without becoming a wall of cards.
7. Integrate recents and last-visited information from Task 02. The console should greet the teacher with continuity, not with a blank slate.
8. Add quick actions that are genuinely common and safe: create note, add evidence, request reflection, open current unit, draft family update, view coordinator comments, review DP milestone queue.
9. Make the console programme-aware. A PYP teacher should see PYP-centric actions; an MYP teacher should see criteria/interdisciplinary actions; a DP teacher should see IA/TOK/EE/CAS follow-up. Shared layout, distinct content.

## Interaction and UX requirements
- Every card must answer 'what is the action, why does it matter, and where do I go next?' in a glance.
- Avoid notification spam. Collapse low-priority or unchanged items into secondary sections.
- The top of the console should be personally useful within 5 seconds of opening the app.
- Use progressive disclosure: a concise headline with expandable detail, not giant text blocks.

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
- Teacher-console rendering tests with representative PYP, MYP, and DP data states.
- Tests that action cards open the correct route/deep link.
- Tests that empty-state teachers still get sensible onboarding prompts rather than a blank wall.

## Acceptance criteria
- Teacher IB home is action-oriented and resume-oriented.
- Teachers can jump from home to current work in one click.
- The console supports evidence, publishing, coordination, and project/core follow-up without extra navigation layers.
- The page remains useful on tablet and smaller desktop widths.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 04 will build the coordinator variant of the home/ops summary. Tasks 05–13 will make the teacher action cards resolve into real production surfaces.
