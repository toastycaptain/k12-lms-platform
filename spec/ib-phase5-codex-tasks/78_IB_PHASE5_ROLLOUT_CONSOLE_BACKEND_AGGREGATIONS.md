# Task 78 — Rollout Console Backend Aggregations

## Phase step
3 — Build the real IB admin/coordinator governance layer

## Purpose
Provide the aggregated backend data needed for an IB rollout console: feature flags, active pack,
academic year pinning, migration drift, route readiness, document adoption, and programme settings
completeness.

## Current repo anchors
- `apps/core/app/models/feature_flag.rb`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/ib_programme_setting.rb`
- `apps/core/app/services/ib/support/route_builder.rb`

## Deliverables
- One or more aggregation endpoints for the rollout console.
- Health/coverage metrics around pack adoption, feature flags, route completeness, school scoping, and legacy usage.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Compute whether required IB feature flags are enabled by tenant and school.
- Report active pack version, deprecated-pack record counts, and pack/schema drift from Task 74.
- Report how many IB users or records still touch legacy planning routes or objects if that remains measurable.
- Report whether school scoping and required endpoints are operational for all IB slices.
- Include settings completeness and academic year pinning state.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Aggregation spec tests with fixture tenants/schools in multiple readiness states.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- The backend can produce a single coherent rollout readiness payload instead of the frontend stitching together many endpoints.

### 9) Pitfalls and guardrails
- Do not rely on slow ad hoc counts that will make the console unusable; precompute or optimize where needed.

### 10) Handoff to the next task

Before moving to Task 79, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
