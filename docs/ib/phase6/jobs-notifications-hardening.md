# IB Phase 6 Jobs, Exports, Notifications, and Replay Hardening

## Scope
This document closes Tasks 121 through 125.

## Job topology
The phase 6 operator layer treats the following as first-class replayable or inspectable work:
- import execution
- publishing queue scheduling/holding/publishing
- standards packet exports
- readiness refresh and rollout follow-up

## Hardening moves applied
- publishing dispatch is wrapped with lock-based sequencing to reduce duplicate transitions
- standards export enqueue uses a digest/snapshot key to avoid duplicate exports for the same state
- export jobs run on an explicit `ib_exports` queue and retry on standard job failures
- notifications now support `dedupe_key` and user-preference event types for pilot-specific events
- failed import batches can be replayed from the admin console instead of shell-only recovery

## Replay rules
- replay is safe only for operations with explicit idempotency or staging semantics
- import replays prefer execute when the batch is ready, otherwise dry-run to surface blockers
- replay does not grant cross-tenant or cross-school reach

## Operator checklist
- use `Job operations` for inventory, retry rules, and failure backlog
- use `Pilot analytics` to distinguish queue health issues from one-off user friction
- only roll back data if the execution payload says the created records are rollback-safe
- escalate if the same batch or export repeatedly fails after replay
