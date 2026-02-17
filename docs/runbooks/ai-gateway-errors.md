# AI Gateway Errors Runbook

## Scope
Failures in AI generation requests (`AiInvocation.status = failed`) or elevated AI latency.

## Detection
- Alert: AI latency or failure metrics exceed thresholds.
- Manual checks:
  - `GET /api/v1/health` -> `checks.ai_gateway`
  - `GET /v1/health` on AI gateway
  - Recent `ai_invocations` with non-null `error_message`

## Triage Steps
1. Verify gateway reachability and response code:
   - `curl -sS "$AI_GATEWAY_URL/v1/health"`
2. Inspect failed invocation records:
   - `SELECT id, provider_name, model, task_type, status, error_message, created_at FROM ai_invocations WHERE status = 'failed' ORDER BY id DESC LIMIT 50;`
3. Confirm active provider config exists and is valid (`ai_provider_configs.status = active`).
4. Check token and model constraints from `ai_task_policies`.

## Common Causes
- Expired or invalid provider API key.
- Upstream provider rate limits.
- Invalid/unsupported model override.
- Max token or policy limit conflicts.
- Transient network failures to provider.

## Recovery
1. Rotate/repair API keys in `ai_provider_configs`.
2. Temporarily switch active provider/model if upstream outage is isolated.
3. Reduce token load for affected task type.
4. Retry failed invocations if safe for workflow semantics.

## Escalation
- Escalate if p95 AI latency > 30s for > 15 minutes or failures > 20%.
- Disable high-volume AI features temporarily if provider outage is confirmed.
