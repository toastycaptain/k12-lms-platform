# Database Issues Runbook

## Scope
Postgres connectivity, pool exhaustion, lock contention, and sustained slow queries.

## Detection
- Alert: API p95 latency or DB connection pool usage over threshold.
- `GET /api/v1/health` shows `checks.database.status = error`.
- Slow query warnings in app logs.

## Triage Steps
1. Validate DB connectivity from app host.
2. Inspect active sessions and long-running queries:
   - `SELECT pid, usename, state, query_start, now() - query_start AS runtime, query FROM pg_stat_activity ORDER BY runtime DESC LIMIT 20;`
3. Check lock contention:
   - `SELECT * FROM pg_locks WHERE NOT granted;`
4. Review recent deploys for query pattern changes.

## Common Causes
- N+1 query regressions after feature changes.
- Missing indexes on high-selectivity filters.
- Long-running transactions holding locks.
- Connection leak or pool misconfiguration.

## Recovery
1. Kill clearly stuck long-running sessions if safe.
2. Roll back recent deploy if regression is confirmed.
3. Add/adjust indexes and run migration.
4. Increase DB pool only after confirming app query behavior.

## Follow-up
- Capture exact query samples and EXPLAIN plans.
- Add regression tests or dashboard monitors for repeated query patterns.
