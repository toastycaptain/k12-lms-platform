# Task 73 — Pack Pinning, Schema Visibility, and Serializer Upgrades

## Phase step
2 — Promote and operationalize the active IB pack

## Purpose
Make pack versioning visible and trustworthy in APIs and UIs. Every IB document and record must
communicate which pack, schema, and workflow it is using so teachers, coordinators, and admins are
not operating blind during rollout.

## Current repo anchors
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`
- `apps/web/src/curriculum/documents/DocumentEditor.tsx`
- `apps/web/src/features/ib/data.ts`

## Deliverables
- Serializer fields exposing pack key, pack version, schema key, workflow key/state, and migration status wherever IB studios and queues need them.
- UI treatments showing pack/schema/workflow metadata in page headers and admin readouts without cluttering teacher workflows.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Audit current JSON serialization of `CurriculumDocument` and related records. Add missing fields for `pack_key`, `pack_version`, `schema_key`, and the resolved workflow identifier if absent.
- Include pack/schema metadata in create responses and version responses so the frontend can display them without extra fetches.
- Expose migration indicators when a record is running on a deprecated schema or requires backfill.

### 3) Frontend work
- Extend document detail headers and coordinator surfaces to show pack/schema/workflow metadata in a compact, non-bureaucratic way.
- Add admin-only affordances to inspect pack/schema details deeply when troubleshooting, while keeping teacher-facing displays minimal.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.
- Expect changes in `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json` or adjacent pack/contract files if the pack contract needs expansion.

### 6) Test plan
- Serializer tests for pack/schema/workflow fields.
- Frontend tests for teacher vs admin visibility rules for metadata badges or drawers.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Create at least one new IB record after the pack/flag changes and confirm the correct pack/schema/workflow is attached.

### 8) Acceptance criteria
- A coordinator can tell what pack/schema a document is on without opening database consoles.

### 9) Pitfalls and guardrails
- Do not overwhelm teacher pages with raw technical metadata; make it collapsible or secondary.

### 10) Handoff to the next task

Before moving to Task 74, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
