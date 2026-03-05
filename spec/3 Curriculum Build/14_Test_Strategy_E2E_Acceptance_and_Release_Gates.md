# 14 Test Strategy E2E Acceptance and Release Gates

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Define a complete, enforceable quality strategy for the Curriculum Build shift so releases are blocked unless backend, frontend, cross-service integration, and operational safety checks meet explicit go/no-go criteria.

## Current State and Gap
Current state:
- Rails has request/model/service/contract test coverage and OpenAPI consistency checks.
- Next.js has unit/integration tests and Playwright end-to-end coverage.
- Curriculum profile functionality has baseline tests but not yet comprehensive release gates tied to the 14-spec rollout.

Grounding references:
- [`apps/core/spec/contracts/openapi_spec.rb`](../../apps/core/spec/contracts/openapi_spec.rb)
- [`apps/core/spec/contracts/openapi_validation_spec.rb`](../../apps/core/spec/contracts/openapi_validation_spec.rb)
- [`apps/core/spec/contracts/schema_consistency_spec.rb`](../../apps/core/spec/contracts/schema_consistency_spec.rb)
- [`apps/core/spec/services/curriculum_profile_resolver_spec.rb`](../../apps/core/spec/services/curriculum_profile_resolver_spec.rb)
- [`apps/core/spec/workflows/teacher_planning_workflow_spec.rb`](../../apps/core/spec/workflows/teacher_planning_workflow_spec.rb)
- [`apps/core/spec/workflows/assessment_workflow_spec.rb`](../../apps/core/spec/workflows/assessment_workflow_spec.rb)
- [`apps/web/e2e/teacher-planning.spec.ts`](../../apps/web/e2e/teacher-planning.spec.ts)
- [`apps/web/e2e/admin.spec.ts`](../../apps/web/e2e/admin.spec.ts)
- [`apps/web/e2e/cross-cutting.spec.ts`](../../apps/web/e2e/cross-cutting.spec.ts)
- [`apps/web/src/test/contract-tests/course-api.test.ts`](../../apps/web/src/test/contract-tests/course-api.test.ts)
- [`packages/contracts/core-v1.openapi.yaml`](../../packages/contracts/core-v1.openapi.yaml)
- [`packages/contracts/curriculum-profiles/profile.schema.json`](../../packages/contracts/curriculum-profiles/profile.schema.json)
- [`spec/PRD_K12_Planning_LMS_AI_Optimized.md`](../PRD_K12_Planning_LMS_AI_Optimized.md)
- [`spec/TECH_SPEC_K12_Planning_LMS.md`](../TECH_SPEC_K12_Planning_LMS.md)

Gap summary:
- No single release gate spec that combines curriculum-profile contracts, resolver behavior, role-security, integration context, and district governance across services.
- Mandatory scenarios are not yet codified as hard block criteria in CI/CD.
- Rollback readiness is not standardized with test-derived signals.

## Scope
### In Scope
- Backend test strategy: unit, service, request, policy, serializer, contract tests.
- Frontend test strategy: unit/integration/contract/e2e coverage for curriculum behaviors.
- End-to-end validation across `apps/core`, `apps/web`, and `apps/ai-gateway` integration paths.
- Mandatory acceptance scenarios and measurable release gates.
- Test evidence packaging for go/no-go decisions.

### Out of Scope
- Replacing the existing testing frameworks.
- Full synthetic performance platform build-out beyond defined curriculum release thresholds.
- New product features not explicitly required by the 14-spec curriculum build plan.

## Test Architecture
### Layer 1: Backend unit and service tests (`apps/core`)
Purpose:
- Validate pure/domain logic and resolver behavior before API coupling.

Required coverage groups:
- Profile pack registry validation and compatibility adapter.
- Resolver precedence and fallback reasoning.
- Workflow engine transition guards and side-effects.
- Governance inheritance resolution and traceability.
- Security policy and serializer decision helpers.

Target files to add/update:
- `apps/core/spec/services/curriculum_profile_registry_spec.rb`
- `apps/core/spec/services/curriculum_profile_resolver_spec.rb`
- `apps/core/spec/services/*workflow*_spec.rb`
- `apps/core/spec/policies/*curriculum*_policy_spec.rb`
- `apps/core/spec/serializers/*curriculum*_serializer_spec.rb`

Minimum bar:
- 100% branch coverage for resolver precedence and lifecycle state machine modules.
- Every fallback reason enum has at least one positive and one negative test.

### Layer 2: Backend request and contract tests (`apps/core`)
Purpose:
- Verify `/api/v1` contracts, authorization boundaries, tenant scoping, and schema compatibility.

Required coverage groups:
- Admin lifecycle routes (validate/import/publish/deprecate/freeze/rollback).
- Pinning/freeze APIs by tenant, school, course, academic year.
- Diagnostics and observability payload fields.
- Integration context envelope generation endpoints.
- District inheritance and override endpoints.

Target files to add/update:
- `apps/core/spec/requests/api/v1/curriculum_profiles/*`
- `apps/core/spec/requests/api/v1/curriculum_resolver/*`
- `apps/core/spec/requests/api/v1/district_curriculum/*`
- `apps/core/spec/contracts/openapi_spec.rb`
- `apps/core/spec/contracts/openapi_validation_spec.rb`

Minimum bar:
- 100% of new/changed curriculum endpoints covered by request specs.
- 100% of new fields reflected in `packages/contracts/core-v1.openapi.yaml` and validated in CI.

### Layer 3: Frontend unit and integration tests (`apps/web`)
Purpose:
- Validate runtime composition behaviors, role-gated UI, and schema-driven planner rendering.

Required coverage groups:
- Navigation composition from profile payload and RBAC filtering.
- Terminology injection behavior and fallback labels.
- Planner schema renderer component registry mapping.
- Admin lifecycle UX and freeze/pin controls.
- Security UX (hidden mutation controls for non-admin roles).

Target files to add/update:
- `apps/web/src/app/admin/**/*test.tsx`
- `apps/web/src/app/plan/**/*test.tsx`
- `apps/web/src/components/**/*test.tsx`
- `apps/web/src/lib/__tests__/api.test.ts`

Minimum bar:
- 100% of new profile-derived UI components have unit/integration test coverage.
- Keyboard and accessibility assertions for all generated schema-form controls.

### Layer 4: Cross-service and E2E tests
Purpose:
- Prove real user paths and integration payload propagation with stable fixtures.

Required suites:
- Admin governance flows (publish, freeze, rollback, diagnostics).
- Teacher planning flows with schema-derived planner behavior.
- Non-admin security denial flows.
- Integration envelope propagation to Google/Classroom/LTI/OneRoster adapters.
- Profile-aware report rendering and export behavior.

Target files to add/update:
- `apps/web/e2e/admin.spec.ts`
- `apps/web/e2e/teacher-planning.spec.ts`
- `apps/web/e2e/cross-cutting.spec.ts`
- `apps/web/e2e/google-native.spec.ts`
- `apps/core/spec/workflows/*_workflow_spec.rb`
- `apps/ai-gateway/tests/*` (for envelope passthrough/validation)

Minimum bar:
- Mandatory acceptance scenarios must pass in CI twice consecutively on `main` candidate commit.
- No flaky test tolerance for mandatory gates; any flake is treated as fail until quarantined and replaced.

## Mandatory Acceptance Scenarios
All scenarios below are release-blocking.

### Scenario A: Admin change to derived planner behavior
Given:
- Admin publishes profile version `ib_continuum@2026.2` with planner schema change.

When:
- Teacher opens planner editor in scoped tenant/school/course context.

Then:
- UI renders new schema-driven fields.
- Resolver payload includes trace metadata.
- Saved planner object validates against profile schema.

Example resolver assertion payload:
```json
{
  "profile_key": "ib_continuum",
  "resolved_profile_version": "2026.2",
  "selected_from": "course_pin",
  "fallback_reason": null,
  "resolution_trace_id": "res_01JABCDXYZ"
}
```

### Scenario B: Non-admin mutation denial
Given:
- Teacher/curriculum lead/non-admin user token.

When:
- User attempts mutation on admin-only curriculum governance endpoint.

Then:
- API returns `403`.
- No data mutation occurs.
- Security audit event is recorded.

Example denial assertion payload:
```json
{
  "error": {
    "code": "forbidden",
    "message": "Not authorized"
  },
  "meta": {
    "policy": "CurriculumProfilePolicy",
    "action": "publish",
    "request_id": "req_01JABCDXYZ"
  }
}
```

### Scenario C: Integration context propagation
Given:
- Curriculum action triggers integration export/sync.

When:
- Adapter payload is produced for Google/Classroom/LTI/OneRoster path.

Then:
- Canonical curriculum context envelope fields are present.
- Legacy payload consumers remain functional under compatibility rules.
- Validation failures are logged with trace IDs and surfaced in diagnostics.

Example envelope assertion payload:
```json
{
  "curriculum_context": {
    "tenant_id": "tn_123",
    "school_id": "sch_99",
    "course_id": "crs_42",
    "profile_key": "american_common_core",
    "profile_version": "2026.1",
    "resolution_trace_id": "res_01JABCDXYZ"
  }
}
```

### Scenario D: Reporting changes by profile
Given:
- Report query with profile-aware filters.

When:
- Admin and teacher run equivalent report views.

Then:
- Derived report blocks and profile defaults are applied consistently.
- RBAC is respected for sensitive governance dimensions.
- Export schemas remain backward-compatible for existing report pipelines.

## Authorization and Security Constraints
- Every request test must assert Pundit outcome (`allow` or `forbid`) explicitly.
- Every mutation test must assert tenant isolation (`Current.tenant` scoped records only).
- Cross-tenant fixtures are mandatory in request/E2E suites for all governance endpoints.
- Serializer tests must assert non-admin cannot view mutable governance fields.
- District-admin paths must assert scope boundaries across district/tenant/school inheritance.

## Data Model Changes
Fixture requirements:
- At least two tenants, each with at least two schools and two courses.
- At least two academic years (`current`, `next`).
- Profile versions in lifecycle states: `draft`, `published`, `deprecated`, `frozen`.
- Course-level pin plus school-level fallback to exercise resolver precedence.
- District override fixture and school override fixture for conflict tracing.

Factory/seed alignment:
- Reuse and extend existing factories/seeds where present.
- Avoid ad-hoc fixture JSON inside E2E tests; keep canonical fixtures under shared test support directories.

## API and Contract Changes
### OpenAPI and schema artifacts
- Update and validate new endpoints and resolver fields in:
  - `packages/contracts/core-v1.openapi.yaml`
- Add/update curriculum profile schemas under:
  - `packages/contracts/curriculum-profiles/`

### Contract CI checks
- Backend contract tests fail if:
  - endpoint exists without OpenAPI entry,
  - OpenAPI entry exists without request spec coverage,
  - schema enum/value drift occurs between code and contract.

## UI and UX Behavior Changes
- Snapshot and interaction tests for runtime-composed navigation states by role.
- A11y tests for schema-rendered planners (focus order, labels, error announcements).
- E2E checks ensure terminology substitutions are visible and consistent across page shells and forms.
- Visual regression checks for admin lifecycle controls and diagnostics screens.

## Rollout and Migration Plan
Phase 1: Shadow validation
- Run new resolver + workflow logic in shadow mode for selected tenants.
- Compare shadow outputs to current outputs and emit mismatch reports.

Phase 2: Cohort enablement
- Enable curriculum build flags for pilot tenant cohort.
- Run full mandatory acceptance scenarios nightly and on deploy candidate.

Phase 3: General availability gate
- Require zero Sev-1 regressions and all mandatory scenarios passing for seven consecutive days before global enablement.

Migration verification checks:
- Backfill jobs produce expected pinning/freeze records.
- Unresolved school/course mapping queue remains below threshold.
- Rollback rehearsals complete within approved RTO.

## Monitoring and Alerts
Release dashboard signals:
- `curriculum.release_gate.mandatory_pass_rate`
- `curriculum.release_gate.flake_rate`
- `curriculum.security.forbidden_mutation_attempts`
- `curriculum.resolver.fallback_rate`
- `curriculum.integration.envelope_validation_failures`

Alert thresholds:
- Mandatory pass rate < 100% on release candidate branch: block release.
- Flake rate > 1% in mandatory suites over 24h: block release.
- Any unauthorized mutation success in tests or production canary: Sev-1 and auto-halt.

## Test Matrix
| Layer | Suite Type | Required Cases | Gate |
| --- | --- | --- | --- |
| Backend | Unit/Service | resolver, registry, lifecycle, workflow guards | 100% pass |
| Backend | Request | `/api/v1` auth, tenant scope, lifecycle, governance, diagnostics | 100% pass |
| Backend | Contract | OpenAPI parity, schema parity, enum drift checks | 100% pass |
| Frontend | Unit/Integration | nav composition, terminology, planner renderer, RBAC UI gates | 100% pass |
| Frontend | A11y | keyboard flow, labels, errors on generated forms | 100% pass |
| E2E | Core flows | Scenarios A-D + rollback smoke flow | 100% pass twice |
| Integration | Adapter payloads | Google/Classroom/LTI/OneRoster context envelope | 100% pass |

## Acceptance Criteria
1. All four mandatory acceptance scenarios pass in CI and pre-release staging.
2. Every new/changed curriculum endpoint has request tests and OpenAPI contract coverage.
3. Resolver v2 fields (`selected_from`, `fallback_reason`, `resolved_profile_version`, `resolution_trace_id`) are asserted in backend and frontend tests.
4. Non-admin mutation-denial is enforced and verified across request and E2E tests.
5. Integration context envelope is validated for all supported integration paths.
6. Release gate dashboard shows no blocking threshold violations for candidate release window.

## Release Gate Checklist (Go/No-Go)
All checks below are mandatory and binary.

### Go criteria
- All required test layers pass at 100% for release candidate commit.
- Mandatory scenarios A-D pass twice consecutively in clean CI runs.
- Contract artifacts are updated and merged with no drift.
- No unresolved Sev-1/Sec-1 defects in curriculum feature surfaces.
- Rollback drill has been run successfully within target RTO in the current release cycle.

### No-go triggers
- Any failing mandatory scenario.
- Any unauthorized mutation allowed.
- Any cross-tenant data leakage signal.
- Any unresolved OpenAPI/schema drift on changed endpoints.
- Any blocker issue in integration envelope validation.

## Risks and Rollback
### Risks
- Overly broad gate set may delay release if flaky suites are not stabilized.
- Inadequate fixture realism may hide multi-tenant edge cases.
- Partial contract updates can create false confidence between web and core behavior.

### Rollback procedure
1. Disable curriculum-build feature flags by cohort (`tenant`, then `school`) with no destructive migration rollback.
2. Revert resolver/workflow endpoint routing to previous stable code path.
3. Keep logging and audit trails active to preserve incident context.
4. Run rollback smoke tests:
   - admin read paths,
   - teacher planner save,
   - non-admin mutation denial,
   - integration payload basic publish.
5. Re-open release only after root cause fix and full mandatory scenario re-pass.

## Non-Goals
- Defining product behavior outside the curriculum profile/gov/workflow surfaces.
- Mandating a specific CI vendor implementation.
- Introducing a new test framework or replacing existing RSpec/Vitest/Playwright stacks.

## Codex Execution Checklist
1. Map each of the 14 curriculum specs to concrete test requirements and assign test ownership per app/package.
2. Add/expand backend unit and service tests for resolver, registry, lifecycle, workflow, and governance inheritance.
3. Add/expand backend request tests for all new `/api/v1` curriculum endpoints including RBAC and tenant scoping assertions.
4. Update OpenAPI and schema artifacts and enforce parity checks in contract test suites.
5. Add/expand frontend unit/integration tests for runtime nav, terminology injection, schema-driven planner rendering, and role-gated controls.
6. Add/expand E2E suites for mandatory scenarios A-D plus rollback smoke flow.
7. Add integration tests for curriculum context envelope injection and compatibility behavior per integration path.
8. Implement release gate aggregation and fail-fast blocking criteria in CI pipeline.
9. Execute staged rollout validation (shadow, cohort, GA) with required monitoring thresholds.
10. Run rollback rehearsal and capture evidence in release checklist artifacts.
