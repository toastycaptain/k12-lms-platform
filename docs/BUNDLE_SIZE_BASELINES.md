# Bundle Size Baselines

| Route | JS Size (gzip) Target | Notes |
|---|---:|---|
| `/login` | <= 50 KB | Keep auth shell lean |
| `/dashboard` | <= 100 KB | Primary post-login landing |
| `/plan/units` | <= 100 KB | Unit list and filters |
| `/teach/courses/[id]/gradebook` | <= 150 KB | Heavy grid view |
| `/admin/analytics` | <= 150 KB | Charts and aggregated data |

## Workflow
1. Run `npm run analyze` in `apps/web`.
2. Capture route-level JS sizes from build analyzer output.
3. Update this table when a route exceeds or improves baseline.

## Guardrail
- Any route above target should be treated as a performance regression and fixed before merge.
