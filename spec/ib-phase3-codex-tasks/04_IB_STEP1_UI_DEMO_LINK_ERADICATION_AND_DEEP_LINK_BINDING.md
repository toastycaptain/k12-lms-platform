# Task 04 — IB STEP1 UI DEMO LINK ERADICATION AND DEEP LINK BINDING

## Position in sequence
- **Step:** 1 — Bind the IB UI to live document flows
- **Run after:** Task 03
- **Run before:** Task 05 will now bind the actual record pages to live document loading.
- **Primary mode:** Backend + Frontend

## Objective
Remove every remaining `/demo` or mock-ID deep link from the IB experience and bind all cards, timeline items, queue rows, and dashboard modules to real entity IDs/routes provided by live payloads.

## Why this task exists now
Even a single dead or fake deep link undermines trust in the entire IB product. Teachers and coordinators will assume the system is unfinished if cards open fake examples rather than their real work.

## Current repo anchors
- `apps/web/src/features/ib/home/IbDashboardPage.tsx`
- `apps/web/src/features/ib/home/TeacherActionConsole.tsx`
- `apps/web/src/features/ib/home/CoordinatorOverview.tsx`
- `apps/web/src/features/ib/coordinator/CollaborationHub.tsx`
- `apps/web/src/features/ib/student/StudentLearningStream.tsx`
- `apps/web/src/features/ib/operations/ProgrammeOperationsCenter.tsx`
- `apps/web/src/features/ib/reports/ExceptionReportShell.tsx`
- `apps/web/src/features/ib/shared/mock-data.ts`

## Scope
- Find and remove all hardcoded demo hrefs, placeholder IDs, or “sample route” values across the IB feature set.
- Replace them with data-driven route targets supplied by the workspace summary endpoints or record payloads.
- Where a surface still lacks enough backend data to produce a real link, add a temporary disabled state and explicit copy explaining why rather than linking to a fake page.
- Add automated tests that fail if `/demo` appears in the built source or route registry for IB pages.

## Backend work
- Add any missing route or ID fields to summary/detail payloads needed for deep links.
- Ensure summary endpoints return object identity and canonical routes in the payload to avoid frontend reconstruction.

## Frontend work
- Refactor all IB cards/tiles/rows to accept `href` or route descriptors from props rather than importing route constants and fake IDs directly.
- Delete or drastically shrink `mock-data.ts`; only keep narrowly scoped visual test fixtures if required.
- Build a small link-validation utility that can be reused in Storybook or test fixtures to prevent regressions.

## Data contracts, APIs, and model rules
- Payloads for cards and queues should include both `href` and `entity_ref` (type + id) so future telemetry can track click-through by entity type.
- Disabled states should include `disabled_reason` when no deep link can be shown safely.

## Risks and guardrails
- Do not replace a fake link with a generic list page if the user expectation is to open a specific record.
- Do not hide broken links without creating a better empty/blocked state; invisible failure is worse.

## Testing and verification
- Run a repository grep in CI for `/demo` under `apps/web/src/features/ib` and `apps/web/src/app/ib`.
- Add component tests for home, operations, review, and student/guardian streams that confirm rendered links point to canonical hrefs from payloads.

## Feature flags / rollout controls
- Roll out with the same live-route flag from Tasks 02–03.
- Do not merge if any IB screen still depends on fake route IDs for primary workflow actions.

## Acceptance criteria
- There are zero user-facing fake/demo links left in the IB experience.
- Every primary CTA lands on a real page or is intentionally disabled with a clear explanation.
- IB pages no longer depend on hardcoded sample IDs for navigation.

## Handoff to the next task
- Task 05 will now bind the actual record pages to live document loading.
