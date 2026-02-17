# Alert Thresholds

| Metric | Warning | Critical | Runbook |
|--------|---------|----------|---------|
| API p95 latency | > 500ms | > 2000ms | `database-issues.md` |
| API error rate (5xx) | > 1% | > 5% | `deployment-rollback.md` |
| Job failure rate | > 5% | > 20% | `sync-failure.md` |
| AI gateway latency | > 5s | > 30s | `ai-gateway-errors.md` |
| Auth failure rate | > 10% | > 50% | `auth-failures.md` |
| Database pool usage | > 80% | > 95% | `database-issues.md` |

## Notes
- Evaluate thresholds over a rolling 5 minute window.
- Page on-call only at critical thresholds; warning thresholds should open ticket/Slack alert.
- Review thresholds quarterly and after major architecture changes.
