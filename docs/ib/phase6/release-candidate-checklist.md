# IB Pilot Release Candidate Checklist

## Blocking gates
- repo integrity scripts pass
- web lint/typecheck/test/build pass
- core migrations and IB request/service specs pass
- AI gateway tests pass
- Playwright `@ib-smoke` pass
- active IB pack baseline matches `ib_continuum_v1@2026.2`
- phase 6 pilot flag bundle is applied and verified
- readiness overall status is not `red`
- no failed standards exports or held publishing items without a named owner

## Migration order
1. take backup
2. deploy code
3. run core migrations
4. verify pack baseline and feature flags
5. run readiness refresh
6. run Playwright smoke or equivalent deploy smoke
7. enable school/programme pilot state if needed

## Post-deploy smoke
- admin: `/ib/rollout`
- admin/coordinator: `/ib/readiness`
- teacher: `/ib/evidence`
- teacher: `/ib/families/publishing`
- coordinator: `/ib/standards-practices`
- DP/PYP route smoke: `/ib/pyp/poi`, `/ib/dp/coordinator`

## Informational checks
- Sidekiq queue depths acceptable
- Active Storage artifact writes available
- no unexpected legacy route traffic spikes
- telemetry pipeline receiving route, publish, export, and readiness events
