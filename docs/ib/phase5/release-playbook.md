# IB Phase 5 Release Playbook and Go/No-Go Criteria

## Rollout Order
1. Confirm `ib_continuum_v1@2026.2` is active for the pilot tenant/school.
2. Enable the phase 5 baseline flags.
3. Verify rollout console drift counts and settings completeness.
4. Verify pilot readiness is green/yellow with known remediation only.
5. Enable `ib_documents_only_v1` for the pilot school after legacy-route counts are acceptably low.
6. Run the critical regression suite before each expansion step.

## Critical Regression Gates
### Backend
- `bundle exec rails zeitwerk:check`
- targeted request/service specs for route resolution, governance, standards, and evidence/publishing filters

### Frontend
- `npm run typecheck`
- `npm test`
- `npm run build`
- route-registry parity tests and page-level IB console/detail tests

## Pilot Smoke Routes
Open these directly in a fresh browser tab during release QA:
- `/ib/home`
- `/ib/pyp/poi`
- `/ib/pyp/units/<id>`
- `/ib/myp/units/<id>`
- `/ib/myp/projects/<id>`
- `/ib/dp/course-maps/<id>`
- `/ib/evidence`
- `/ib/families/publishing`
- `/ib/standards-practices/packets/<id>`
- `/ib/rollout`
- `/ib/readiness`

## Go / No-Go Criteria
### Go
- route readiness is canonical for the pilot school
- required flags are enabled
- programme settings are complete
- no unreviewed red readiness sections
- no unexplained export/publish failure spikes
- documents-only mode is only enabled where migration drift is acceptable

### No-Go
- route-resolution regressions or blank/dead-end pages on canonical routes
- legacy route counts rising during pilot prep
- school-mismatch or forbidden states appearing for normal teacher/coordinator paths
- repeated publish/export failures without containment
- unscoped approvals leaking across schools or tenants

## Rollback Rules
- turn off `ib_documents_only_v1` first if legacy plan access must be restored temporarily
- turn off the most specific feature flag before disabling broad pack flags
- preserve telemetry and audit evidence; do not delete export or publish audit trails during rollback
- keep route-resolution redirects active until canonical traffic is stable again
