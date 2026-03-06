# Task 76 — Programme Settings Backend Domain Expansion

## Phase step
3 — Build the real IB admin/coordinator governance layer

## Purpose
Expand `IbProgrammeSetting` from a thin record into a real programme-governance domain object that
can drive cadence defaults, review ownership, exception thresholds, and school/programme-specific
settings in a durable way.

## Current repo anchors
- `apps/core/app/models/ib_programme_setting.rb`
- `apps/core/app/models/feature_flag.rb`
- `apps/core/app/models/school.rb`

## Deliverables
- Richer backend semantics for programme settings with validation, defaults, auditing, and school/programme scoping.
- APIs for reading/updating programme settings safely.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Add typed settings fields or a validated settings payload covering cadence mode, review owner role, threshold tuning, approval SLA targets, digest defaults, and any school/programme overrides needed by the Phase 5 operations center.
- Implement create/update/read endpoints under a clear admin/coordinator namespace with policy checks.
- Log changes or store updated_by metadata so administrators can audit who changed governance settings.
- Ensure settings can exist at tenant-wide default, school override, and programme override levels if that is part of the architecture. If layering already exists elsewhere, integrate rather than duplicate.

### 3) Frontend work
- Plan for a settings console that can read one normalized response shape rather than multiple fragmented endpoints.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Model validation tests for setting constraints.
- Policy/request specs for permitted roles.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- Programme settings are no longer an afterthought and can actually drive later coordinator/admin features.

### 9) Pitfalls and guardrails
- Do not bury critical thresholds in unvalidated JSON without clear defaults and migration paths.

### 10) Handoff to the next task

Before moving to Task 77, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
