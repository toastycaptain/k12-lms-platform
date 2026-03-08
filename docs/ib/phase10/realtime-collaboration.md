# Phase 10 Step 4 — Real-Time Collaboration

## Scope
- collaboration topology and authenticated presence channels
- optimistic concurrency and soft-lock policy
- suggestion threads, review handoffs, task follow-up, and replay markers
- operator-safe throttling and audit visibility

## Architecture
- Presence remains production-safe through authenticated polling and session heartbeats.
- Logical channels are exposed through the collaboration session payload:
  - `document_presence`
  - `section_presence`
  - `durable_change_feed`
- The collaboration workbench is the canonical contract for:
  - transport strategy
  - concurrency rules
  - rate limits
  - soft locks
  - suggestions
  - threaded comments
  - replay timeline
  - teacher success benchmarks

## Concurrency policy
- Editors claim a `scope_key` through heartbeat sync.
- Competing editors on the same `scope_key` raise `conflict_risk`.
- Autosave remains optimistic and version-based.
- Manual saves emit durable `change_patch` events so replay and operator timelines stay inspectable.
- Suggestions resolve through explicit accept or reject actions; nothing applies silently.

## UI surface
- `IbDocumentStudio` now exposes a live collaboration panel beside the shared document editor.
- The panel keeps four actions in one place:
  - add suggestion
  - add comment
  - create handoff task
  - record replay marker

## Rate limits
- `/api/v1/ib/collaboration_sessions`: 30 writes/minute per user
- `/api/v1/ib/collaboration_events`: 60 writes/minute per user
- `/api/v1/ib/document_comments`: 30 writes/minute per user

## Manual QA
1. Open the same IB document in two teacher sessions.
2. Focus the same field in both tabs and confirm `conflict_risk` and the soft-lock row appear.
3. Add a suggestion, accept it, then verify the suggestion closes and the timeline shows the replay marker or save event.
4. Create a handoff task and confirm it appears in the workbench task list.
