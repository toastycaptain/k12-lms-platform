# Task 94 — Telemetry Event Taxonomy and Instrumentation

## Phase step
7 — Add pilot telemetry, readiness reporting, and release controls

## Purpose
Define and implement the telemetry needed to operate an IB pilot intelligently. Phase 5 needs
measurable signals for route usage, save latency, workflow failures, publish outcomes, queue health,
and pack mismatch issues.

## Current repo anchors
- `apps/web/src/lib/performance.ts`
- `apps/core/app/models/feature_flag.rb`
- `apps/core/app/controllers/`
- `docs/`

## Deliverables
- A telemetry taxonomy document plus instrumentation across backend and frontend for critical IB flows.
- Structured events for route hits, save times, transition failures, publish outcomes, export jobs, and pack mismatch detections.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Emit structured events around workflow transitions, export jobs, publishing outcomes, and API error classes relevant to IB routes.
- Log feature-flag and pack-version context where safe and appropriate.

### 3) Frontend work
- Track page loads, load timing, save latency, queue action timing, and client-side error states on IB routes.
- Instrument deep route usage so pilot readiness can identify dead areas and friction hotspots.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.
- Expect changes under `docs/`, `spec/`, or a dedicated runbook directory for readiness and rollout documentation.

### 6) Test plan
- Instrumentation smoke tests or mocks proving events fire with expected payload shape.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- The team can observe how the IB pilot actually behaves rather than relying on anecdotal feedback only.

### 9) Pitfalls and guardrails
- Do not emit sensitive educational content in telemetry payloads.

### 10) Handoff to the next task

Before moving to Task 95, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
