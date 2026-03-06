# Task 74 — IB Pack Migration Backfills and Drift Audit

## Phase step
2 — Promote and operationalize the active IB pack

## Purpose
Audit and backfill existing IB records so the system can move from mixed pack/schema histories to a
stable operational footing. This task is about consistency, not silent destructive migration.

## Current repo anchors
- `apps/core/app/models/curriculum_document.rb`
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json`
- `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json`
- `apps/core/app/models/feature_flag.rb`

## Deliverables
- A migration audit report checked into `docs/` or `spec/` describing counts of IB documents/records by pack version and schema key.
- Idempotent backfill jobs or rake tasks that upgrade metadata/pinning where safe.
- Explicit lists of records that require manual review rather than unsafe automated mutation.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Build a report/query that enumerates all IB documents by `document_type`, `pack_version`, `schema_key`, `status`, `school_id`, and `academic_year_id`.
- Identify safe metadata backfills (for example missing pack version or route hints) and implement idempotent jobs.
- For content-shape changes that are not trivially safe, create a manual-review backlog rather than guessing transformations.

### 3) Frontend work
- Expose migration audit summaries in the rollout/admin console from Tasks 78–79.
- Give coordinators/admins a way to filter to records needing review.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.
- Expect changes in `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json` or adjacent pack/contract files if the pack contract needs expansion.

### 6) Test plan
- Backfill job tests proving idempotency.
- Audit/report tests proving deprecated pack versions are counted correctly.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Create at least one new IB record after the pack/flag changes and confirm the correct pack/schema/workflow is attached.

### 8) Acceptance criteria
- There is a visible migration baseline and a repeatable way to reduce drift.

### 9) Pitfalls and guardrails
- Do not mutate historical content versions unless the migration is explicitly approved and reversible.

### 10) Handoff to the next task

Before moving to Task 75, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
