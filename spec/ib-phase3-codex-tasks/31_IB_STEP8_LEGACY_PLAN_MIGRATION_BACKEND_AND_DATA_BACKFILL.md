# Task 31 — IB STEP8 LEGACY PLAN MIGRATION BACKEND AND DATA BACKFILL

## Position in sequence
- **Step:** 8 — Consolidate the planning stack
- **Run after:** Task 30
- **Run before:** Task 32 moves the IB frontend fully onto the document-backed routes and surfaces.
- **Primary mode:** Backend + Frontend

## Objective
Build the backend migration and backfill pipeline that converts relevant IB legacy planning records into curriculum documents (or links them safely), including versions, relationships, and pack/schema assignment.

## Why this task exists now
A clean frontend cutover is impossible if existing IB plan data is stranded in legacy tables. This task creates the migration/backfill path so real schools can move without data loss.

## Current repo anchors
- Output from Task 30
- `apps/core/app/models/unit_plan.rb` / `lesson_plan.rb` / `template.rb` and version models
- `apps/core/app/models/curriculum_document*.rb`
- `apps/core/db/migrate/*`
- `apps/core/app/services/curriculum/*`

## Scope
- Design and implement migration/backfill services from legacy plan objects into `CurriculumDocument` and `CurriculumDocumentVersion` for IB mode.
- Preserve titles, versions, core content, standards alignments, resource links, ownership, school, academic year, workflow state where possible, and route/link continuity metadata.
- Record provenance so migrated documents can be audited and, if necessary, traced back to legacy IDs.

## Backend work
- Build idempotent migration services/rake tasks or scripts.
- Define how legacy `UnitPlan`, `LessonPlan`, and `Template` records map to the richer IB pack document types or to compatibility document types if one-to-one mapping is not immediately possible.
- Backfill document links, alignments, and workflow state where feasible.
- Add `migrated_from_*` metadata for traceability.

## Frontend work
- Only add minimal frontend work here if needed to read migration metadata or display “migrated from legacy” banners.

## Data contracts, APIs, and model rules
- Document migration assumptions and lossiness risks explicitly.
- Prefer append/new-document migration over in-place mutation of legacy records so rollback remains possible.

## Risks and guardrails
- Do not silently drop legacy fields that later coordinator/family/reporting flows rely on.
- Do not write one-off migration scripts with no re-run safety or logging.

## Testing and verification
- Migration service tests using representative legacy IB records.
- Data integrity tests verifying version counts, links, and ownership metadata survive the migration.
- Dry-run mode and logging requirements for operational safety.

## Feature flags / rollout controls
- Keep behind `ib_documents_only_v1` and a separate backfill-run guard.
- Do not auto-run migration on deploy in production environments.

## Acceptance criteria
- There is a safe, repeatable way to backfill IB legacy planning data into curriculum documents.
- Task 32 can now cut the IB frontend over to document-backed routes without orphaning old work.

## Handoff to the next task
- Task 32 moves the IB frontend fully onto the document-backed routes and surfaces.
