# Task 82 — Standards & Practices Export Domain, Jobs, and Artifact Storage

## Phase step
4 — Turn Standards & Practices into a real evaluation subsystem

## Purpose
Upgrade standards packet export from a status toggle into a durable export pipeline with artifacts,
snapshots, reviewer history, and cycle-level integrity. This is one of the biggest admin-side
differentiators against older IB systems.

## Current repo anchors
- `apps/core/app/models/ib_standards_cycle.rb`
- `apps/core/app/models/ib_standards_packet.rb`
- `apps/core/app/models/ib_standards_packet_item.rb`
- `apps/core/app/controllers/`

## Deliverables
- Actual export jobs for standards packets/cycles.
- Stored export artifacts and immutable evidence snapshots at export time.
- Version history and audit records for exports.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Introduce an export job model or job metadata sufficient to track queued/running/succeeded/failed exports.
- Persist generated artifacts via Active Storage or the platform’s artifact mechanism.
- Snapshot the evidence references included in an export so historical packet views do not drift when source records change later.
- Record who initiated export, when, and under what cycle/packet version.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend Rails controllers/services/serializers, request specs, and possibly migrations/jobs under `apps/core/**`.

### 6) Test plan
- Job tests for export success/failure/retry.
- Model tests proving exported packet snapshots are immutable.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.
- Export or preview at least one standards packet and verify evidence provenance is visible.

### 8) Acceptance criteria
- Exporting a standards packet creates a real artifact with history, not just a status change.

### 9) Pitfalls and guardrails
- Do not mutate source evidence items to represent export state; exports should be their own durable artifacts.

### 10) Handoff to the next task

Before moving to Task 83, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
