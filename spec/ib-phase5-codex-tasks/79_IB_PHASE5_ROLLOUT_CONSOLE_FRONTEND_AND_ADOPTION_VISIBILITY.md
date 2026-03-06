# Task 79 — Rollout Console Frontend and Adoption Visibility

## Phase step
3 — Build the real IB admin/coordinator governance layer

## Purpose
Build the IB rollout console for admins and IB leads so they can understand whether the
tenant/school is actually ready to use the IB product in production.

## Current repo anchors
- `apps/web/src/app/ib/`
- `apps/web/src/features/ib/data.ts`
- `apps/web/src/lib/school-context.tsx`

## Deliverables
- A dedicated rollout/governance page under the IB admin/coordinator area.
- Panels showing feature flags, active pack, migration drift, academic year readiness, route completeness, and settings completeness.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 3) Frontend work
- Render readiness sections with explicit green/yellow/red states rather than walls of raw config text.
- Provide drilldowns to the underlying flagged issues (for example deprecated pack records, missing settings, legacy route usage).
- Make school switching explicit so district-level admins can inspect one school at a time without ambiguity.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Page tests for readiness state rendering and school switching.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- An admin can answer 'are we ready to pilot IB at this school?' from one console.

### 9) Pitfalls and guardrails
- Do not conflate rollout readiness with everyday teacher operations; keep the console clearly admin/coordinator oriented.

### 10) Handoff to the next task

Before moving to Task 80, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
