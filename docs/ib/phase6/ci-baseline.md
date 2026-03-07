# CI Baseline and Pilot Verification Matrix

## Authoritative pilot baseline commands
### Web
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- `cd apps/web && npm test`
- `cd apps/web && npm run build`

### Core
- `cd apps/core && bundle exec rails zeitwerk:check`
- `cd apps/core && bundle exec rails db:migrate`
- `cd apps/core && bundle exec rspec spec/services/ib spec/requests/api/v1/ib_phase5_api_spec.rb spec/requests/api/v1/ib_phase6_api_spec.rb`

### AI gateway
- `cd apps/ai-gateway && pytest`

### Playwright smoke
- `cd apps/web && npm run e2e -- --grep @ib-smoke`

## Quarantine policy
- No silent `skip` for pilot-critical tests.
- If a suite must be quarantined, it requires an inline reason, owner, and exit condition in code or workflow config.

## Current baseline posture
- Web and core build/test/typecheck/lint are blocking.
- Playwright IB smoke is blocking for pilot release candidates.
- Slow full-matrix suites remain informational only when a narrower smoke shard already proves the pilot path.
