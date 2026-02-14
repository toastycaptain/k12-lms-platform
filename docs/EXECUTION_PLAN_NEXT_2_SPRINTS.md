# Execution Plan (Next 2 Sprints)

This plan operationalizes the 8 recommended improvements without changing the stack.

## Sprint 1 (Reliability + Security Baseline)

| Epic | Goal | Tasks | Acceptance Criteria |
|------|------|-------|---------------------|
| 1. Traceability + delivery control | Make spec progress explicit and auditable | Keep `docs/TRACEABILITY.md` current for PRD-9..15; require updates in PR template review | Traceability table is complete and reflects current statuses |
| 2. AI path cleanup | Remove broken/unwired AI paths from runtime assumptions | Remove dead/unwired AI integration code in `apps/core`; document current AI scope as gateway-only | No dead Rails AI endpoint references to missing classes remain |
| 3. Institutional hardening scope gate | Prevent partial LTI/OneRoster code from being mistaken as production-ready | Mark Phase 7 deferred in documentation; remove or quarantine unreachable partial controllers/jobs | Deferred status is explicit; no unreachable partial endpoints remain in active routing surface |
| 4. RBAC hardening wave 1 | Reduce over-broad data visibility | Tighten highest-risk policy scopes (`Course`, `Enrollment` first); add request specs for role visibility boundaries | Non-admin users cannot read cross-role/cross-enrollment data outside allowed scope |
| 5. Contracts bootstrap | Start real contract governance | Add baseline OpenAPI docs in `packages/contracts` for Core v1 and AI Gateway v1 | Contract files exist and cover key endpoints in active use by web |
| 6. Audit foundation | Add a usable audit trail primitive | Add audit log table + write path for high-risk actions (auth/session, approval actions, grading actions, integration sync triggers) | Audit records created for the selected action set |

## Sprint 2 (Product Completion + Verification Depth)

| Epic | Goal | Tasks | Acceptance Criteria |
|------|------|-------|---------------------|
| 7. UX parity closure | Close major UX-spec gaps | Implement missing top-level routes (`/report`, `/communicate`) with production-ready pages or explicit deferred state; align nav to real routes | No dead top-nav routes; UX gaps explicitly resolved or deferred |
| 8. AI UX + policy controls | Move AI from service-only to product capability | Add admin-facing AI provider/policy management UI and tenant-level policy enforcement integration points | Admin can view/manage AI provider and policy settings in app UI |
| 9. Test depth expansion | Reduce regression risk in weakest surfaces | Add web app tests for key flows; extend AI gateway tests for auth, stream error paths, and safety edge cases | New tests run in CI and cover critical flows currently untested |
| 10. RBAC hardening wave 2 | Complete least-privilege policy posture | Replace remaining broad `scope.all` policy implementations with role/ownership scopes | All policy scopes are role-aware; no broad unrestricted scopes remain without explicit rationale |
| 11. Observability uplift | Improve incident response | Add operational dashboards/runbooks for sync failures and gateway errors; ensure key actions are traceable | Documented runbooks and measurable error/latency visibility are in place |

## Cross-Sprint Guardrails

| Guardrail | Rule |
|----------|------|
| Backward compatibility | Do not change stack/framework selections in this plan |
| Security | Every new endpoint/action must have explicit policy coverage and test coverage |
| Tenancy | All new persisted records remain tenant-scoped |
| CI quality gates | Maintain passing monorepo CI at each merge point |
