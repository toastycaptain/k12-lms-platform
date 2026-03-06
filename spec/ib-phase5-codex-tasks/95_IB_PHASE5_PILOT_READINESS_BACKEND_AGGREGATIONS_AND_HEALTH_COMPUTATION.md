# Task 95 — Pilot Readiness Backend Aggregations and Health Computation

## Phase step
7 — Add pilot telemetry, readiness reporting, and release controls

## Purpose
Compute backend pilot-readiness signals that combine route coverage, pack state, feature flags,
queue health, settings completeness, export readiness, and recent failure rates into one coherent
health model.

## Current repo anchors
- `apps/core/app/models/feature_flag.rb`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/ib_programme_setting.rb`
- `apps/core/app/models/ib_standards_packet.rb`
- `apps/core/app/models/ib_publishing_queue_item.rb`

## Deliverables
- Backend readiness endpoints or services that power the Pilot Readiness Console.
- Health scores or explicit readiness sections with transparent component metrics.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Aggregate route coverage completeness (from Tasks 65–71), active pack/flag health (72–75), settings completeness (76–79), review governance health (80–81), standards/export readiness (82–85), publishing health (86–89), and document migration health (90–93).
- Include recent telemetry indicators from Task 94, such as transition failure rate or publish failure rate.
- Keep the logic explicit and inspectable; avoid magic composite scores without underlying components.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.
- Expect changes under `docs/`, `spec/`, or a dedicated runbook directory for readiness and rollout documentation.

### 6) Test plan
- Aggregation tests across a set of fixture schools representing green/yellow/red readiness.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- The backend can answer 'is this school ready to pilot IB?' with explainable evidence.

### 9) Pitfalls and guardrails
- Do not hide all readiness behind one opaque score; sections and reasons matter.

### 10) Handoff to the next task

Before moving to Task 96, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
