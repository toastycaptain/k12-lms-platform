# Task 65 — Route Tree Audit and Canonical URL Contract

## Phase step
1 — Materialize the canonical IB route tree

## Purpose
Create a single authoritative inventory of every IB URL the product is expected to support, then
reconcile that inventory against the current state of the repo so Codex can stop building against
implied or demo-only routes. This task establishes the canonical contract that every subsequent
Phase 5 task must obey.

## Current repo anchors
- `apps/core/app/services/ib/support/route_builder.rb`
- `apps/web/src/app/ib/layout.tsx`
- `apps/web/src/app/ib/page.tsx`
- `apps/web/src/curriculum/navigation/registry.ts`
- `apps/web/src/features/ib/data.ts`
- `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json`

## Deliverables
- A canonical route inventory document checked into the repo under spec/ or docs/ that lists every IB route, the entity it resolves, the required permissions, and the target React/Next page file.
- A route registry module on the frontend that no longer depends on hand-written demo links or ad-hoc href strings embedded in cards.
- A parity checklist between the backend `Ib::Support::RouteBuilder` and the frontend route registry so future drift can be detected.
- A list of deprecated or placeholder `/demo` and hash-anchor destinations that must be removed or redirected in later tasks.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Enumerate every route that `Ib::Support::RouteBuilder` can generate today and normalize it into a typed route map grouped by programme (PYP/MYP/DP), cross-programme operations, evidence, publishing, standards & practices, and admin/coordinator consoles.
- Add test coverage for route_builder outputs by document type, schema key, operational record family, standards packet/cycle, evidence, learning stories, and publishing queue items. The purpose is to freeze intent before later controller work changes behavior.
- Identify route builder gaps where a record can be created on the backend but no canonical route exists yet. Capture those as explicit TODOs in the contract file rather than leaving them implicit.

### 3) Frontend work
- Create a typed route registry under `apps/web/src/features/ib/routes/` (or equivalent) that maps canonical route IDs to path templates, breadcrumb labels, and helper functions for param generation.
- Replace any route-like strings inside `apps/web/src/features/ib/data.ts` with route helper calls or temporary constants that point at the new registry, even if the pages are not materialized yet.
- Define one place where Next page files can import the canonical route descriptors to build consistent breadcrumbs, tabs, and queue drilldowns.

### 4) Contracts, schema, and API expectations
- Every canonical route entry must declare: `id`, `programme`, `pathnameTemplate`, `recordKind`, `requiredEntities`, `fallbackRoute`, and `featureFlag`.
- Canonical route IDs should be stable and human-readable (for example `ib.pyp.unit.detail`, `ib.myp.project.detail`, `ib.dp.cas.record.detail`, `ib.operations.review`, `ib.standards.packet.detail`).
- Do not let cards or hooks compute hrefs with string concatenation after this task. They should call route helpers that are testable.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Unit tests for route helper generation on the frontend.
- Backend tests for `Ib::Support::RouteBuilder` parity with route expectations.
- A static route audit script or test that fails when route IDs exist in the registry but no page or fallback handler is present.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- There is a single written source of truth for IB routes.
- There are no newly introduced raw `/ib/...` strings in feature code where a helper should be used.
- Subsequent tasks can cite canonical route IDs instead of re-describing paths from scratch.

### 9) Pitfalls and guardrails
- Do not materialize all pages yet; this task is about contract and audit, not implementation of every page.
- Do not preserve `/demo` destinations as first-class entries. Mark them as deprecated explicitly.

### 10) Handoff to the next task

Before moving to Task 66, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
