# IB Phase 9 Collaboration Upgrade and Rollout Controls

Covers task range `295` to `304`.

## What shipped
- Durable collaboration events and follow-up tasks via `IbCollaborationEvent` and `IbCollaborationTask`.
- Collaboration workbench service and API endpoint exposing transport strategy, route audit, recent events, and task state.
- Coordinator collaboration hub now renders the live workbench instead of a static placeholder thread.

## Collaboration model
- Durable events include task, mention, suggestion, approval request, and replay artifacts.
- Ephemeral events remain scoped to join/leave/focus/lock/change signals.
- Transport strategy is explicitly declared as staged heartbeat-plus-polling, keeping the rollout story honest while still preserving durable history.

## Why this matters
- Phase 9 turns collaboration into an auditable operational layer rather than a passive comments feature.
- The workbench now exposes route coverage and task follow-up so rollout decisions can be tied to real collaboration load and behavior.

## Remaining explicit gaps
- Live websocket transport remains intentionally deferred behind staged rollout guidance.
- Collaboration health telemetry is summarized structurally, but not yet connected to a separate time-series dashboard.
