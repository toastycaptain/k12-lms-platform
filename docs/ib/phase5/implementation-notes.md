# IB Phase 5 Implementation Notes

## Scope
Phase 5 turns the IB area from vertical-slice demos into a pilotable product surface with:
- canonical `/ib/**` routing
- pack/version governance
- coordinator/admin governance consoles
- standards export + review operations
- evidence/publishing operational reliability
- document-system migration controls
- telemetry, readiness, and release controls

## Audit Notes Before Coding
### Route tree
- Phase 4 already materialized most `app/ib/**` pages, but route intent was still partly implied by page existence instead of a single contract.
- Backend `Ib::Support::RouteBuilder` and frontend route helpers had begun to converge, but parity was not yet frozen with docs and tests.
- Legacy aliases still existed for `/plan/*`, `/demo`, and hash-anchor entry points. These are intentionally treated as deprecated compatibility paths, not first-class routes.

### Governance and readiness
- Programme settings, rollout, review governance, and readiness services existed, but coverage and written operating guidance were missing.
- Review governance had a real scoping gap around pending approvals; this pass corrects that by filtering approvals to the current tenant/school via the approvable record.
- Pilot readiness initially summarized only part of the operating picture. This pass adds explicit migration and telemetry sections so the readiness console can explain document-system drift and recent failure signals.

### Standards routes
- Standards packet/cycle routes existed and pages were present, but the frontend detail hooks were still deriving packet detail from cycle list payloads instead of the direct show payload.
- This pass switches the standards detail routes to direct API payloads and adds route metadata to standards serializers so detail pages no longer depend on list hydration side effects.

### Documents-only mode
- The `ib_documents_only_v1` flag already existed on the backend, but the web runtime did not surface it.
- This pass exposes the flag through `/api/v1/me`, uses it in runtime state, and routes IB new-planning quick actions and the generic new-unit page toward canonical IB creation surfaces when the flag is enabled.

## Assumptions
- `ib_continuum_v1@2026.2` remains the active pack target for IB mode.
- Canonical IB planning pages may still reuse shared editor primitives under the hood, but the visible route and page chrome must remain IB-native.
- Legacy plan pages remain available as temporary compatibility surfaces until `ib_documents_only_v1` is enabled per tenant/school and migration drift is low enough to cut over safely.
