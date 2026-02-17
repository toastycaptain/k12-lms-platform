# Sync Failure Runbook

## Scope
Google Classroom and OneRoster sync failures (`sync_runs.status = failed`).

## Detection
- Alert: `job.failure_rate` for sync workers breaches threshold.
- Manual: `/api/v1/integration_configs/:id/sync_runs` shows failed runs.

## Triage Steps
1. Confirm failing integration: provider, tenant, and failing sync type.
2. Query recent failures:
   - `SELECT id, sync_type, status, started_at, completed_at FROM sync_runs WHERE status = 'failed' ORDER BY id DESC LIMIT 20;`
3. Inspect logs for a failed run:
   - `SELECT level, message, context FROM sync_logs WHERE sync_run_id = <sync_run_id> ORDER BY id;`
4. Check integration configuration:
   - `integration_configs.status`, token settings, and endpoint base URLs.

## Common Causes
- Expired OAuth token or revoked refresh token.
- Provider rate limiting or transient upstream outage.
- Schema/API response change in Classroom or OneRoster.
- Mapping drift (`sync_mappings`) after roster structure changes.

## Recovery
1. Refresh credentials in `integration_configs`.
2. Re-run sync from admin UI or trigger the same sync job again.
3. If rate-limited, backoff and retry after provider reset window.
4. If schema changed, patch parser/mapping logic and replay run in staging first.

## Escalation
- Escalate to platform on-call if failures continue for > 30 minutes or affect > 1 school.
- If data integrity is in question, pause scheduled syncs until fix is deployed.
