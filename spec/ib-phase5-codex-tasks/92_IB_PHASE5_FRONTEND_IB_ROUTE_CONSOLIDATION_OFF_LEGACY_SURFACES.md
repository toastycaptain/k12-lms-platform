# Task 92 — Frontend IB Route Consolidation Off Legacy Surfaces

## Phase step
6 — Migrate fully toward the IB document system

## Purpose
Complete the frontend side of the cutover so IB users stay inside IB-native routes and only touch
generic shared editors/components under the hood, not as visible primary destinations.

## Current repo anchors
- `apps/web/src/curriculum/documents/DocumentEditor.tsx`
- `apps/web/src/curriculum/documents/DocumentList.tsx`
- `apps/web/src/app/ib/`
- `apps/web/src/curriculum/navigation/registry.ts`

## Deliverables
- Removal or replacement of IB-facing links that still point at generic `/plan/documents/:id` or legacy pages.
- IB-native page wrappers around any remaining shared generic editor components.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 3) Frontend work
- Update navigation, queue links, breadcrumbs, and create flows so all IB primary work happens under `/ib/...` routes.
- If `DocumentEditor` remains the shared implementation core, wrap it inside programme-native page chrome so users do not feel dumped into a generic subsystem.
- Remove or hide legacy navigation affordances for IB users where appropriate.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Route regression tests proving IB entry points do not link to generic planning surfaces except in explicitly approved admin/debug contexts.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- IB feels like a self-consistent product mode rather than a skin over generic plan pages.

### 9) Pitfalls and guardrails
- Do not fork the whole editor implementation if a wrapper pattern is enough.

### 10) Handoff to the next task

Before moving to Task 93, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
