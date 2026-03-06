# Task 93 — Editor / Workflow Unification and IB 'Documents Only' Mode

## Phase step
6 — Migrate fully toward the IB document system

## Purpose
Lock in the architectural win by making the document engine the unquestioned source of truth for IB
mode. This includes workflow usage, page actions, approvals, and any mode-specific editor behavior.

## Current repo anchors
- `apps/web/src/curriculum/documents/DocumentEditor.tsx`
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`
- `apps/core/app/models/feature_flag.rb`

## Deliverables
- A feature-flagged IB 'documents only' mode or equivalent behavior gate that routes all IB planning work through the document engine.
- Unified workflow/action behavior across IB detail pages and generic document operations.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Ensure all IB workflow transitions happen through the current `Curriculum::WorkflowEngine` and document routes, not legacy transition code paths.
- Add any missing backend helpers to support page-level actions consistently.

### 3) Frontend work
- Hide legacy editor entry points for IB when the flag is active.
- Make IB-native pages invoke document workflow actions through one shared adapter.

### 5) Files to touch or create

- Start with the anchor files above.

### 6) Test plan
- Feature-flag tests for documents-only mode.
- Workflow transition tests from IB pages.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- When the IB documents-only flag is on, the user cannot accidentally fall back into legacy planning mode.

### 9) Pitfalls and guardrails
- Do not enable documents-only mode for all tenants until migration and route coverage are proven.

### 10) Handoff to the next task

Before moving to Task 94, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
