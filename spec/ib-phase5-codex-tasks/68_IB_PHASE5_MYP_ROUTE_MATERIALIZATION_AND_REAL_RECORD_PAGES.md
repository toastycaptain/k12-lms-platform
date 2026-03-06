# Task 68 — MYP Route Materialization and Real Record Pages

## Phase step
1 — Materialize the canonical IB route tree

## Purpose
Materialize the real Next.js pages for MYP unit, interdisciplinary, project, service, coverage, and
review routes so MYP workflow is fully route-native and queue-safe.

## Current repo anchors
- `apps/web/src/app/ib/`
- `apps/core/app/services/ib/support/route_builder.rb`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/ib_operational_record.rb`

## Deliverables
- Real page files for `/ib/myp/units/[unitId]`, `/ib/myp/units/new`, `/ib/myp/interdisciplinary/[id]`, `/ib/myp/projects/[id]`, `/ib/myp/service/[id]`, `/ib/myp/coverage`, `/ib/myp/review`.
- Direct-open support from coordinator queues, student actions, and service/project records.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Ensure operational records representing project/service/interdisciplinary work can be resolved from their route params without requiring the frontend to guess record families.
- Provide aggregated page payloads where an MYP page needs both a curriculum document and operational record context.

### 3) Frontend work
- Use page shells to mount the already-built MYP vertical-slice components on real pages.
- Implement create flows that open a real `ib_myp_unit` document immediately.
- Build coverage and review pages as first-class route destinations rather than modal-like overlays hidden behind the coordinator dashboard.

### 4) Contracts, schema, and API expectations
- The service route must be able to open either a service operational record or a service-linked document if the route builder points at one; define the precedence explicitly.
- Coverage routes must be query-param aware so coordinators can share filtered views by year, subject group, or risk level.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- E2E tests for opening MYP routes directly from a notification or queue item.
- Unit tests for route param parsing and fallback handling.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- Every MYP href currently produced in the backend route builder resolves to a real page or explicit fallback page.

### 9) Pitfalls and guardrails
- Do not mix operational-record IDs and curriculum-document IDs without a typed resolver layer.

### 10) Handoff to the next task

Before moving to Task 69, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
