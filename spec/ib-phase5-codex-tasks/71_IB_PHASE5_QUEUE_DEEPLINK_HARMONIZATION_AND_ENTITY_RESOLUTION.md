# Task 71 — Queue Deep-Link Harmonization and Entity Resolution

## Phase step
1 — Materialize the canonical IB route tree

## Purpose
Normalize how all queue-like surfaces encode and open linked work. Teacher consoles, coordinator
queues, evidence inboxes, publishing queues, and notification feeds should all navigate using the
same entity-resolution contract instead of each inventing its own href strategy.

## Current repo anchors
- `apps/web/src/features/ib/data.ts`
- `apps/core/app/services/ib/support/route_builder.rb`
- `apps/core/app/models/ib_operational_record.rb`
- `apps/core/app/models/ib_publishing_queue_item.rb`

## Deliverables
- A single queue-link item shape shared by frontend data adapters and backend serializers.
- Migration of queue cards from raw href strings to typed entity refs + canonical route IDs.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Update queue-producing serializers/endpoints so they return `entity_ref`, `route_id`, `href`, `fallback_route_id`, and `changed_since_last_seen` consistently.
- Audit all IB feed or queue endpoints for inconsistent link metadata and fix them.

### 3) Frontend work
- Update hooks in `apps/web/src/features/ib/data.ts` so queue items derive display links from the canonical route helpers when possible and fall back through the resolution API when stale.
- Ensure queue components preserve filters or return paths so users can review multiple items quickly without losing context.

### 5) Files to touch or create

- Start with the anchor files above.

### 6) Test plan
- Snapshot/contract tests for queue payloads.
- Interaction tests for 'open next item in queue' flows.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- Teacher, coordinator, and publishing queues all use one link contract.

### 9) Pitfalls and guardrails
- Do not keep queue href generation duplicated inside every mapper.

### 10) Handoff to the next task

Before moving to Task 72, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
