# Task 91 — Backend Document Normalization and Backfills

## Phase step
6 — Migrate fully toward the IB document system

## Purpose
Normalize IB records around `CurriculumDocument` and associated operational models so route
resolution, workflows, comments, evidence, and analytics all operate on one coherent graph.

## Current repo anchors
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/curriculum_document_version.rb`
- `apps/core/app/models/ib_operational_record.rb`
- `apps/core/app/models/ib_document_comment.rb`
- `apps/core/app/models/ib_document_collaborator.rb`

## Deliverables
- Backfills or data normalization scripts that ensure IB operational records, evidence, and stories are linked to the right documents/versions where possible.
- Cleaner backend lookup utilities and route hints based on normalized relationships.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Backfill missing `curriculum_document_id`, `curriculum_document_version_id`, or route hints where the relationship is logically knowable and safe.
- Normalize schema keys/document types where drift from earlier phases still exists.
- Ensure comments, collaborators, and workflow actions hang off the document system rather than parallel legacy entities whenever possible.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Backfill idempotency tests and normalization integrity checks.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- IB data relationships are consistent enough that pages and analytics do not need special-case fallback logic everywhere.

### 9) Pitfalls and guardrails
- Do not fake relationships that cannot be inferred safely; log them for manual remediation.

### 10) Handoff to the next task

Before moving to Task 92, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
