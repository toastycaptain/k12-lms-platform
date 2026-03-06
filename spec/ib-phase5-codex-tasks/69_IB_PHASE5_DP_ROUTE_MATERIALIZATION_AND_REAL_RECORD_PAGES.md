# Task 69 — DP Route Materialization and Real Record Pages

## Phase step
1 — Materialize the canonical IB route tree

## Purpose
Materialize the real Next.js pages for DP course maps, internal assessments, EE, TOK, CAS, and
coordinator views so DP work is bookmarkable, reviewable, and operationally reliable.

## Current repo anchors
- `apps/web/src/app/ib/`
- `apps/core/app/services/ib/support/route_builder.rb`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/ib_operational_record.rb`

## Deliverables
- Real page files for `/ib/dp/course-maps/[id]`, `/ib/dp/course-maps/new`, `/ib/dp/internal-assessments/[id]`, `/ib/dp/ee/[id]`, `/ib/dp/tok/[id]`, `/ib/dp/cas/records/[id]`, `/ib/dp/coordinator`.
- Deep-link-safe page loading for student/advisor/coordinator access patterns.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Add or harden API resolution so DP pages can load the right document and operational record combination from a single route param and return consistent forbidden/not-found/archive states.
- Ensure the coordinator page has efficient aggregate data queries instead of N+1 fetches against IA/EE/TOK/CAS records.

### 3) Frontend work
- Mount existing DP surfaces behind real page files and wire them to live data hooks.
- Ensure `/ib/dp/course-maps/new` goes through document creation, pack pinning, and schema selection before redirecting into a live course-map route.
- Make coordinator drilldowns route to the correct detailed object, not modal-only contexts.

### 4) Contracts, schema, and API expectations
- DP routes must distinguish between curriculum document detail pages and operational record detail pages where both exist.
- Student-facing DP routes must never leak coordinator-only fields; page-level gating matters as much as API-level gating.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Direct-load route tests for each DP record family.
- Coordinator-to-detail and student-to-detail navigation tests.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- DP objects no longer depend on generic `/plan/documents/:id` pages for primary access.

### 9) Pitfalls and guardrails
- Do not force all DP pages through a single generic detail component with hidden conditionals; preserve canonical pages.

### 10) Handoff to the next task

Before moving to Task 70, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
