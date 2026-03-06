# Task 96 — Pilot Readiness Frontend Console and Admin/Coordinator Dashboards

## Phase step
7 — Add pilot telemetry, readiness reporting, and release controls

## Purpose
Build the Pilot Readiness Console that turns backend health computation into a practical
admin/coordinator tool. This is the single highest-leverage Phase 5 deliverable because it makes
remaining gaps visible quickly.

## Current repo anchors
- `apps/web/src/app/ib/`
- `apps/web/src/features/ib/data.ts`
- `apps/web/src/lib/school-context.tsx`

## Deliverables
- A pilot-readiness dashboard with route readiness, pack/flag readiness, settings health, queue health, standards/export readiness, publishing reliability, and document migration readiness.
- Admin and coordinator views that can drill into underlying issues.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 3) Frontend work
- Render readiness by section with explainer text and next actions, not just charts.
- Make school/programme filtering explicit and persistent.
- Provide direct links from a readiness issue to the exact route or console where the issue can be fixed.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.
- Expect changes under `docs/`, `spec/`, or a dedicated runbook directory for readiness and rollout documentation.

### 6) Test plan
- Page tests for readiness states and drilldowns.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- An admin/coordinator can use one console to prepare, monitor, and re-check an IB pilot.

### 9) Pitfalls and guardrails
- Do not over-design the visuals at the expense of actionable detail.

### 10) Handoff to the next task

Before moving to Task 97, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
