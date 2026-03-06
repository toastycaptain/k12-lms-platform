# Task 83 — Standards Packet APIs, Evidence Snapshots, Reviewer Assignment, and Scoring

## Phase step
4 — Turn Standards & Practices into a real evaluation subsystem

## Purpose
Provide the backend APIs and scoring semantics needed for a serious standards/practices workflow:
packet detail, item-level evidence provenance, reviewer assignment, completeness, and evidence-
strength scoring.

## Current repo anchors
- `apps/core/app/models/ib_standards_packet.rb`
- `apps/core/app/models/ib_standards_cycle.rb`
- `apps/core/app/models/ib_standards_packet_item.rb`

## Deliverables
- Packet detail endpoints with items, snapshots, reviewer info, states, and export history.
- Cycle comparison payloads and packet completeness/evidence-strength scoring.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Add or extend controllers/serializers for standards cycles and packets.
- Define how packet completeness and evidence strength are computed and returned. Keep the formula visible and testable.
- Support reviewer assignment and state transitions (draft/in_review/approved/returned/exported).
- Expose item provenance so reviewers can trace each packet item back to the source record/evidence.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Request specs for packet detail, cycle comparison, and reviewer assignment.
- Unit tests for scoring logic.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Export or preview at least one standards packet and verify evidence provenance is visible.

### 8) Acceptance criteria
- Packet detail no longer requires the frontend to infer packet health from partial data.

### 9) Pitfalls and guardrails
- Do not hide scoring logic in the UI; keep it on the backend.

### 10) Handoff to the next task

Before moving to Task 84, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
