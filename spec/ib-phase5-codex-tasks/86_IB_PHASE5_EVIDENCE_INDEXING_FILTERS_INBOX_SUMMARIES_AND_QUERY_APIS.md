# Task 86 — Evidence Indexing, Filters, Inbox Summaries, and Query APIs

## Phase step
5 — Productionize evidence, publishing, and notifications

## Purpose
Harden the evidence subsystem so inboxes, teacher consoles, and publishing queues can run on real,
efficient queries instead of broad scans or fragile client-side grouping.

## Current repo anchors
- `apps/core/app/models/ib_evidence_item.rb`
- `apps/core/app/models/ib_reflection_request.rb`
- `apps/core/app/models/ib_learning_story.rb`
- `apps/web/src/features/ib/data.ts`

## Deliverables
- Index and query improvements for evidence searches and inbox summaries.
- Backend endpoints that return evidence inbox summaries and filtered evidence lists for teacher/coordinator views.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Add scopes and database indexes around school, programme, status, visibility, planning_context_id, curriculum_document_id, student_id, created_by, and updated_at.
- Support filters for needs-validation, reflection-requested, family-ready, linked-to-story, unlinked, recent changes, and programme.
- Provide summary counts and small exception lists in the same API shape used by teacher home and evidence inbox pages.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Query and performance-focused request specs or benchmarks for evidence endpoints.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- Evidence pages load quickly and can be filtered without fetching every evidence item.

### 9) Pitfalls and guardrails
- Do not continue relying on `INITIAL_EVIDENCE` or broad frontend-only grouping once these endpoints exist.

### 10) Handoff to the next task

Before moving to Task 87, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
