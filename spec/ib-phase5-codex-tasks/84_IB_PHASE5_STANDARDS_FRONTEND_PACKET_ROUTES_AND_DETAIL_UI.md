# Task 84 — Standards Frontend Packet Routes and Detail UI

## Phase step
4 — Turn Standards & Practices into a real evaluation subsystem

## Purpose
Build canonical standards/practices routes and detail pages so packets and cycles are first-class,
reviewable objects in the product.

## Current repo anchors
- `apps/web/src/app/ib/`
- `apps/web/src/features/ib/data.ts`
- `apps/core/app/services/ib/support/route_builder.rb`

## Deliverables
- Real routes such as `/ib/standards-practices`, `/ib/standards-practices/cycles/[cycleId]`, `/ib/standards-practices/packets/[packetId]` (adjusting for the canonical route contract from Task 65).
- Packet detail UI with evidence item drilldown, reviewer assignment, and export history.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 3) Frontend work
- Render packet and cycle pages with clear state badges, score summaries, export readiness, owner/reviewer context, and item provenance.
- Allow drilling from packet items to the source document/evidence route via canonical route helpers.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Route-level page tests and packet detail rendering tests.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Export or preview at least one standards packet and verify evidence provenance is visible.

### 8) Acceptance criteria
- Standards packets are bookmarkable, reviewable, and navigable like real records.

### 9) Pitfalls and guardrails
- Do not leave standards work trapped in a dashboard card with no canonical detail route.

### 10) Handoff to the next task

Before moving to Task 85, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
