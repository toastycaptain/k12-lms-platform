# Task 75 — Document Type / Workflow Hygiene and Create-Flow Alignment

## Phase step
2 — Promote and operationalize the active IB pack

## Purpose
Clean up any remaining mismatch between IB document types, schema keys, workflow bindings, route
expectations, and frontend creation flows. Phase 5 should eliminate leftover ambiguity inherited
from the earlier generic planner.

## Current repo anchors
- `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json`
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`
- `apps/web/src/curriculum/documents/CreateDocumentWizard.tsx`
- `apps/web/src/curriculum/documents/DocumentEditor.tsx`

## Deliverables
- A verified matrix of IB document types -> schema keys -> workflows -> canonical routes -> allowed create contexts.
- Create-flow updates so every IB creation path launches the correct document type and lands on the correct route.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Review document factory logic and ensure `ib_pyp_unit`, `ib_myp_unit`, `ib_dp_course_map`, etc. create with the expected schema/workflow defaults from the active pack.
- Tighten validation so invalid schema-key overrides or cross-programme create attempts are rejected with actionable messages.

### 3) Frontend work
- Update creation wizards so they display programme-native language and only offer legal create actions for the active planning context.
- Ensure redirect-after-create uses canonical route helpers by document type.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.
- Expect changes in `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json` or adjacent pack/contract files if the pack contract needs expansion.

### 6) Test plan
- Matrix tests for legal/illegal create actions.
- Create-and-redirect integration tests for each major IB document type.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Create at least one new IB record after the pack/flag changes and confirm the correct pack/schema/workflow is attached.

### 8) Acceptance criteria
- No IB create flow lands in the wrong studio or generic page.

### 9) Pitfalls and guardrails
- Do not leave hidden escape hatches that create generic `unit_plan` documents from IB-native entry points.

### 10) Handoff to the next task

Before moving to Task 76, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
