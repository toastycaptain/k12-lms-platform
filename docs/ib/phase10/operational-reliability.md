# Phase 10 Operational Reliability

## Scope
Tasks 357-372 turn the IB stack into an operator-grade system with explicit failure domains, recoverable async work, queue health visibility, and repeatable rehearsal assets.

## Failure domain map
- request path: Rails API request lifecycle, tenant/school scoping, `request_id`, `correlation_id`, W3C `traceparent`
- async queues: `ib_publishing`, `ib_exports`, `ib_imports`, `ib_support`, plus baseline health jobs on `default`
- artifact pipelines: standards export artifacts, report deliveries, import execution checkpoints, publishing state transitions
- external dependencies: Postgres, Redis/Sidekiq, Active Storage, AI gateway, Sentry
- operator recovery: admin rollout console, `/api/v1/ib/job_operations`, `/api/v1/ib/operational_reliability`, `/admin/ib/runbooks`

## Job catalog and retry policy matrix
| Operation | Queue | Idempotency | Retry | Dead letter | Timeout |
| --- | --- | --- | --- | --- | --- |
| `publishing_dispatch` | `ib_publishing` | queue item publish token | 3 attempts, 15s exponential | yes | 120s |
| `standards_export` | `ib_exports` | export snapshot digest | 3 attempts, 15s exponential | yes | 180s |
| `report_delivery` | `ib_exports` | report version + recipient + channel | 3 attempts, 30s exponential | yes | 180s |
| `import_execute` | `ib_imports` | batch checksum + resume cursor | 2 attempts, 60s linear | yes | 600s |
| `analytics_backfill` | `ib_support` | tenant + school + day | 2 attempts, 30s linear | no | 180s |
| `alert_evaluation` | `default` | metric window | single attempt | no | 30s |
| `uptime_monitor` | `default` | health probe window | single attempt | no | 30s |

## Dead letter model
- `ib_operational_jobs` stores queue, retry policy, source record, idempotency key, trace context, and final error payload.
- `ib_operational_job_events` stores timeline entries for queued, started, failed, dead-lettered, replayed, retried, cancelled, and backfill events.
- dead-letter transitions are derived from the catalog retry policy rather than ad hoc controller code.

## Recovery APIs and console
- `GET /api/v1/ib/job_operations`: queue health, failure backlog, recovery timeline, runbook URLs
- `POST /api/v1/ib/job_operations/replay`: requeue a source-aware recovery action
- `POST /api/v1/ib/job_operations/cancel`: mark a tracked job cancelled for operator visibility
- `POST /api/v1/ib/job_operations/backfill`: queue analytics/benchmark backfill
- `GET /api/v1/ib/operational_reliability`: SLOs, trace strategy, Sentry posture, query thresholds, load drills
- `/admin/ib/runbooks`: operator-friendly runbook index inside the web app

## Publishing queue
Anchor: `#publishing-queue`
- publishing replay is now routed through `Ib::Publishing::DispatchJob` and tracked as `publishing_dispatch`
- idempotency relies on the learning story publish token
- preserve ordering by using the queue item as the source record and replaying one item at a time

## Standards export
Anchor: `#standards-export`
- export enqueue now registers a tracked operational job tied to `IbStandardsExport`
- export failures keep their last error and runbook mapping without hiding behind Sidekiq only

## Reporting pipeline
Anchor: `#reporting-pipeline`
- report delivery failures are represented in the same operator queue summary
- the console keeps delivery failure visibility aligned with report release state instead of a second hidden queue

## Migration pipeline
Anchor: `#migration-pipeline`
- import execution now writes `resume_cursor`, `last_row_id`, and recovery metadata to `IbImportBatch`
- failed imports stay resumable from the last executed row rather than forcing a full rerun

## Analytics backfill
Anchor: `#analytics-backfill`
- analytics replay/backfill is a first-class tracked job on `ib_support`
- use when benchmark snapshots or queue-health summaries were missing during an outage window

## Structured logging and tracing
Anchor: `#observability`
- requests now propagate `X-Correlation-ID` and `traceparent`
- `Current` stores `request_id`, `correlation_id`, `trace_id`, and `span_id`
- telemetry and audit logs carry correlation/trace fields so operators can follow a failure across API, job, and operator actions
- job execution spans emit `otel.span.start` and `otel.span.finish` events to logs and timing metrics

## Metrics, dashboards, and SLOs
- Prometheus rules: `infrastructure/phase10/observability/ib_prometheus_rules.yml`
- Grafana dashboard scaffold: `infrastructure/phase10/observability/ib_grafana_dashboard.json`
- primary SLOs:
  - API health >= 99.5%
  - operational job success rate >= 98%
  - queue latency <= 30s for school-day workflows

## Sentry and error budgets
- serious dead-lettered jobs capture Sentry events with queue and source-record tags
- error budget thresholds are controlled by:
  - `IB_ERROR_BUDGET_DAILY_FAILURES`
  - `IB_ERROR_BUDGET_DEAD_LETTER`
- use error budget burn to decide whether rollout remains widened or must pause

## Query observability and capacity thresholds
- warning query latency: 250ms
- critical query latency: 500ms
- large-school queue depth warning: 200 jobs
- large-school queue latency warning: 30s
- indexed surfaces in this pack:
  - `ib_operational_jobs(status, queue_name)`
  - `ib_report_deliveries(status, channel)`
  - `ib_publishing_queue_items(state, scheduled_for)`
  - `ib_mobile_sync_diagnostics(status, workflow_key)`

## Rehearsal assets
- load smoke: `infrastructure/phase10/load/ib_reliability.js`
- chaos drill: `infrastructure/phase10/load/ib_chaos_drill.sh`

## Manual QA
1. Open `/ib/rollout` and confirm Job operations shows queue health, dead-letter counts, and runbook links.
2. Trigger `POST /api/v1/ib/job_operations/backfill` and verify the console shows a queued analytics backfill.
3. Force a standards export or import failure in a test environment and confirm the failure appears with correlation data.
4. Open `/admin/ib/runbooks` and confirm the anchors resolve.
