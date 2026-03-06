# Task 72 — IB Pack Promotion, Default Selection, and Feature Flag Alignment

## Phase step
2 — Promote and operationalize the active IB pack

## Purpose
Promote the richer IB pack from 'artifact present in the repo' to 'active operating contract' for IB
tenants and schools. Align feature flags and tenant defaults so the system behaves deterministically
when an IB school is enabled.

## Current repo anchors
- `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json`
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json`
- `apps/core/app/models/feature_flag.rb`
- `apps/core/app/models/curriculum_document.rb`

## Deliverables
- A documented activation plan for `ib_continuum_v1@2026.2` as the canonical pack for IB mode.
- Feature flag changes or defaults necessary for Phase 5 to function safely.
- Tenant/school-level checks that prevent mixed old/new IB pack behavior without explicit migration handling.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Audit where the active pack is resolved today and ensure the richer pack is the default for IB tenants unless a tenant is explicitly pinned elsewhere.
- Review `FeatureFlag::DEFAULTS` and promote the IB slice flags needed for routes, settings, evidence, operations, and standards/practices if Phase 5 assumes them on.
- Add a diagnostic endpoint or admin-visible payload showing the active pack key/version and whether a tenant is running on a deprecated IB pack.

### 3) Frontend work
- Surface active pack/version and feature-flag readiness in coordinator/admin views rather than keeping them invisible backend concerns.
- Creation flows should present only the valid document types allowed by the active pack.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.
- Expect changes in `packages/contracts/curriculum-profiles/ib_continuum_v1_2026_2.json` or adjacent pack/contract files if the pack contract needs expansion.

### 6) Test plan
- Resolver tests proving IB tenants get the correct pack version by default.
- Feature flag tests proving readiness pages display accurate state.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Create at least one new IB record after the pack/flag changes and confirm the correct pack/schema/workflow is attached.

### 8) Acceptance criteria
- An IB tenant can be inspected and clearly understood as 'running 2026.2' with the required flags and modules enabled.

### 9) Pitfalls and guardrails
- Do not globally flip flags for non-IB tenants.
- Do not silently upconvert old data without audit visibility.

### 10) Handoff to the next task

Before moving to Task 73, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
