# IB Phase 6 Analytics Contract

## Scope
This document closes Tasks 130 through 134.

## Canonical event groups
### Frontend interaction events
- `ib_workspace_render`
- `ib_route_view`
- `ib_workspace_first_interaction`
- `ib_workspace_click_depth`
- `ib_help_opened`
- `ib_pilot_setup_step_opened`
- `ib_pilot_setup_saved`
- `ib_import_batch_created`
- `ib_import_mapping_saved`
- `ib_import_dry-run`
- `ib_import_execute`
- `ib_import_rollback`
- `ib_job_replayed`

### Backend authoritative events
- import dry-run, execute, rollback, and replay emissions through `Ib::Support::Telemetry`
- publishing transition emissions
- standards export lifecycle emissions
- readiness and rollout health snapshots

## Required payload dimensions
- tenant scope
- school scope when applicable
- role or operator surface
- programme when applicable
- route or entity reference when applicable
- timestamps generated at the source of truth

## Double-counting rule
- frontend emits user interaction intent
- backend emits authoritative lifecycle milestones
- scorecards should not count both as the same business event

## Phase 6 dashboards
The pilot analytics console reports four buckets:
- teacher friction
- coordinator operations
- latency and queue health
- pilot success scorecard

## Privacy rule
Do not emit student content bodies, guardian messages, or raw document content in telemetry. Use entity references, counts, statuses, and route hints instead.
