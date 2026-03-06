# Task 90 — Legacy IB Path Audit, Freeze Policy, and Migration Checklist

## Phase step
6 — Migrate fully toward the IB document system

## Purpose
Create the explicit migration policy that moves IB mode away from legacy planning paths and prevents
new IB work from drifting back into old `UnitPlan` / `LessonPlan` or generic `/plan` surfaces.

## Current repo anchors
- `apps/web/src/curriculum/documents/DocumentEditor.tsx`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`

## Deliverables
- A written audit of legacy IB touchpoints still present in the repo.
- A freeze policy that prohibits new IB feature work on legacy models/routes.
- A migration checklist tying each remaining legacy touchpoint to a cutover path.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Audit controllers, jobs, and serializers for any remaining IB dependencies on legacy models or routes.

### 3) Frontend work
- Audit navigation, create flows, and deep links for any routes that still send IB users into generic plan pages unless explicitly allowed.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- A lint-like or route-audit test that catches forbidden legacy links under `ib/` entry points.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- The team has an explicit policy and checklist for completing the IB document-system cutover.

### 9) Pitfalls and guardrails
- Do not silently keep both systems active forever; document the temporary overlap intentionally.

### 10) Handoff to the next task

Before moving to Task 91, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
