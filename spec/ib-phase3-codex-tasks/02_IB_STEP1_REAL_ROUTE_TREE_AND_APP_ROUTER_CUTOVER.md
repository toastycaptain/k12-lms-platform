# Task 02 — IB STEP1 REAL ROUTE TREE AND APP ROUTER CUTOVER

## Position in sequence
- **Step:** 1 — Bind the IB UI to live document flows
- **Run after:** Task 01
- **Run before:** Task 03 will add live summary endpoints and route loaders against this new tree.
- **Primary mode:** Backend + Frontend

## Objective
Create the real Next.js route tree that matches the canonical IB route-object model. Every registered IB route that should be navigable must resolve to an actual `app/ib/...` page or redirect, and every existing workspace card must land on a live page scaffold instead of a placeholder.

## Why this task exists now
The current repository has top-level `app/ib` workspace pages but not the full nested route tree implied by the IB registry. This creates the exact kind of shallow, dead-end product experience that teachers and coordinators distrust.

## Current repo anchors
- Output from Task 01
- `apps/web/src/app/ib/layout.tsx`
- `apps/web/src/app/ib/*`
- `apps/web/src/features/ib/core/route-registry.ts`
- `apps/web/src/features/ib/shared/IbWorkspaceScaffold.tsx`
- `apps/web/src/features/ib/layout/IbShell.tsx`

## Scope
- Create real route segments and page files for all canonical PYP, MYP, DP, operations, review, evidence, and family publishing routes identified in Task 01.
- Use nested layouts where appropriate so context rails, breadcrumbs, and work-mode switches are preserved without duplication.
- Introduce redirect pages or Next.js redirects for old aliases that should continue to work temporarily.
- Standardize route params and route-level metadata so every page can resolve the correct record and permissions cleanly.

## Backend work
- Add any small backend support needed for route loaders, such as slug resolution or compact detail serializers, but avoid introducing domain models unrelated to routing in this task.
- Where needed, add controller support for `include` parameters or compact detail endpoints to reduce page loader chatter.

## Frontend work
- Create `app/ib/pyp/...`, `app/ib/myp/...`, `app/ib/dp/...`, and other route groups according to the matrix from Task 01.
- Make route pages thin shells that call feature components and hooks rather than duplicating business logic in `page.tsx` files.
- Replace hardcoded hrefs in IB surfaces with calls to central route helpers using real IDs from props/data.
- Ensure student and guardian route trees are equally explicit and do not piggyback on teacher-only paths.

## Data contracts, APIs, and model rules
- Define route param conventions (`documentId`, `poiId`, `storyId`, `queueId`, etc.) and keep them stable.
- Where a page needs both a planning context and a document, prefer route params for the primary object and fetch related context from the object payload.
- Document redirect behaviour for old `/plan/units/:id` or legacy admin aliases that should land inside the IB route tree for IB users.

## Risks and guardrails
- Do not move existing shared shells in a way that breaks non-IB routes.
- Do not duplicate the same page logic in multiple alias pages; use redirects or shared page modules.
- Do not leave route params untyped or inconsistently named.

## Testing and verification
- Add route smoke tests that render all canonical routes with mocked params and verify the page component exists.
- Add link-health tests over the route registry and workspace config.
- Manually verify nested layout behaviour for teacher, coordinator, student, and guardian personas.

## Feature flags / rollout controls
- Use `ib_live_routes_v1` to control new page exposure if needed.
- Keep old aliases functional until Task 32 completes the frontend cutover from legacy plan surfaces.

## Acceptance criteria
- Every canonical IB route resolves to a real page file or explicit redirect.
- No workspace card opens a missing page.
- The route tree is readable enough that later tasks can bind live data without creating one-off route hacks.

## Handoff to the next task
- Task 03 will add live summary endpoints and route loaders against this new tree.
