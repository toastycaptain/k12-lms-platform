# Deployment Rollback Runbook

## Scope
Failed deploys causing elevated 5xx, severe latency regressions, or broken critical workflows.

## Detection
- Alert: API 5xx exceeds threshold.
- Smoke tests fail immediately after deploy.
- Health endpoint moves to degraded due to new release.

## Triage Steps
1. Confirm incident start time aligns with deploy timestamp.
2. Review deploy logs and runtime logs for new exceptions.
3. Verify migration state and any pending migration errors.
4. Evaluate blast radius (single tenant vs multi-tenant).

## Rollback Procedure (Railway)
1. Identify last known good release.
2. Execute rollback with Railway CLI:
   - `railway up --service core --detach --from <previous-release-id>`
3. Verify app health:
   - `GET /api/v1/health`
4. Run smoke checks for login, course load, and submission flow.

## Post-Rollback
1. Freeze additional deploys until root cause is identified.
2. Create incident timeline with:
   - trigger
   - detection
   - mitigation
   - recovery time
3. Open a post-mortem with preventive action items.
