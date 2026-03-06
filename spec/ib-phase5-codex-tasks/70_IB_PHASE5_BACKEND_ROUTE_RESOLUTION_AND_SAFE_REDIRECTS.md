# Task 70 — Backend Route Resolution, Entity Lookups, and Safe Redirects

## Phase step
1 — Materialize the canonical IB route tree

## Purpose
Provide backend support for canonical route resolution so pages and queues can ask the server for
the correct destination, validate access, and fall back safely when a record is missing, archived,
moved, or outside school scope.

## Current repo anchors
- `apps/core/app/services/ib/support/route_builder.rb`
- `apps/core/app/controllers/api/v1/`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/ib_operational_record.rb`
- `apps/core/app/models/ib_standards_packet.rb`
- `apps/core/app/models/ib_evidence_item.rb`

## Deliverables
- A lightweight route-resolution API that can accept an entity reference and return the canonical href, route ID, access status, fallback target, and display label.
- Server-side safe redirect logic or redirect metadata for stale/deprecated routes and legacy `/demo` routes.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Implement an endpoint like `/api/v1/ib/resolve` or similar that accepts either `entity_ref` or explicit route params and returns a canonical resolution object.
- Return explicit resolution statuses such as `ok`, `forbidden`, `not_found`, `school_mismatch`, `archived_redirect`, `deprecated_redirect`.
- Support legacy route migration by returning `redirect_to` values so the frontend can migrate bookmarks and queue items gracefully.
- Where feasible, normalize route resolution through a service object so controllers, jobs, and notification generation all share the same logic.

### 3) Frontend work
- Use the resolution API in places where a stale link may be encountered (notifications, stored activity feed items, old queue entries).
- Add a thin frontend adapter so pages can recover from stale deep links and land on the server-recommended destination.

### 4) Contracts, schema, and API expectations
- Resolution responses must include the canonical route ID from Task 65, not just an href string.
- Resolution must be school-scoped and role-aware.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Request specs for every resolution status.
- Regression tests for legacy route migration from `/demo` or generic plan URLs.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- The product can recover from stale or migrated links without leaving users on dead pages.

### 9) Pitfalls and guardrails
- Do not use open redirects; only server-approved canonical IB routes are allowed as redirect targets.

### 10) Handoff to the next task

Before moving to Task 71, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
