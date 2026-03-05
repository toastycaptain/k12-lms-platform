# 07 Runtime Composed Navigation and Terminology

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Enable profile-driven navigation and terminology so the product shell feels native to IB, US standards-based, and UK curriculum contexts without forking frontend code.

## Current State and Gap
Current navigation is hardcoded by role in `AppShell` and terminology is mostly static outside unit creation context.

Grounding references:
- [`apps/web/src/components/AppShell.tsx`](../../apps/web/src/components/AppShell.tsx)
- [`apps/web/src/app/plan/units/new/page.tsx`](../../apps/web/src/app/plan/units/new/page.tsx)
- [`apps/core/app/controllers/api/v1/sessions_controller.rb`](../../apps/core/app/controllers/api/v1/sessions_controller.rb)
- [`apps/core/app/services/curriculum_profile_resolver.rb`](../../apps/core/app/services/curriculum_profile_resolver.rb)

Gap summary:
- Role-aware nav exists, but no profile-aware nav.
- Terminology labels are not globally injected.
- No runtime config endpoint for composed navigation.

## Scope
### In Scope
- Define profile-driven nav payload format.
- Define route registry and safe composition rules.
- Define terminology token injection model.
- Define AppShell integration and fallback behavior.

### Out of Scope
- Planner schema rendering internals (File 06).
- Report-level profile adaptations (File 08).

## Navigation Composition Contract
### Route registry
Maintain a server-side whitelist mapping logical keys to route targets and metadata.

Example registry keys:
- `dashboard`
- `planner`
- `continuum`
- `standards_browser`
- `assessment_analytics`
- `curriculum_map`
- `pastoral`
- `reports`

Pack references keys only, not arbitrary URLs.

### Composed payload endpoint
- `GET /api/v1/navigation/composition`

### Example response
```json
{
  "effective_profile": {"key": "british_cambridge", "version": "2026.2"},
  "labels": {
    "unit": "Scheme of Work Unit",
    "grade": "Key Stage / Year",
    "standards": "Programmes of Study"
  },
  "navigation": [
    {"key": "dashboard", "label": "Home", "href": "/dashboard"},
    {"key": "planner", "label": "Curriculum", "href": "/plan"},
    {"key": "reports", "label": "Reports", "href": "/report"}
  ]
}
```

## Data Model Changes
No new DB table required for v1.
If caching composed nav per tenant/user becomes necessary, use cache layer only; no persisted nav state in this phase.

## API and Contract Changes
### New endpoint
- `GET /api/v1/navigation/composition`

### Session payload extension
Optionally include lightweight label tokens in `/api/v1/me` response for immediate shell hydration.

### OpenAPI updates
Add endpoint and response schema in:
- [`apps/core/config/openapi/core-v1.openapi.yaml`](../../apps/core/config/openapi/core-v1.openapi.yaml)
- [`packages/contracts/core-v1.openapi.yaml`](../../packages/contracts/core-v1.openapi.yaml)

## UI and UX Behavior Changes
### AppShell integration
- Replace static nav constant as source of truth with composed payload.
- Retain role filtering and authorization-driven visibility.
- Keep static nav as fallback if composition endpoint unavailable.

### Terminology injection
Use token map for repeated labels in planner/report/admin surfaces.
Token examples:
- `label.unit`
- `label.grade`
- `label.subject`
- `label.standards`

## Authorization and Security Constraints
- Endpoint available to authenticated users.
- Payload must already be role-filtered server-side.
- No hidden route keys returned for unauthorized roles.
- Tenant scoping required for all composition logic.

## Rollout and Migration Plan
1. Add composition endpoint with server-side registry mapping.
2. Update AppShell to fetch composed nav behind flag `runtime_nav_composition_v1`.
3. Add terminology token provider in frontend.
4. Migrate high-traffic pages to tokenized labels.
5. Expand to remaining pages after verification.

## Monitoring and Alerts
Metrics:
- `navigation_composition.fetch_success_count`
- `navigation_composition.fetch_failure_count`
- `navigation_composition.fallback_to_static_count`
- `terminology_token.missing_count`

Alerts:
- Static fallback > 1% of authenticated shell loads.
- Missing token count spike for any tenant.

## Test Matrix
### Unit
- Composition service produces deterministic output by role/profile.

### Request
- Endpoint returns role-filtered nav items.

### Frontend
- AppShell renders composed nav and fallback nav.
- Label tokens appear consistently in migrated surfaces.

### Security
- Unauthorized roles do not receive restricted nav keys.

## Acceptance Criteria
1. AppShell can render from runtime composition payload.
2. Profile-specific terminology is visible in shell and key pages.
3. No unauthorized nav items are exposed in payload or UI.
4. Static fallback protects UX during service disruption.
5. Contracts are documented and tested.

## Risks and Rollback
### Risks
- Nav flicker during async composition fetch.
- Partial token migration causing inconsistent terminology.

### Rollback
1. Disable `runtime_nav_composition_v1`.
2. Revert AppShell to static role-based nav.
3. Keep terminology token map optional and non-blocking.

## Codex Execution Checklist
1. Implement server-side route registry and composition service.
2. Add `GET /api/v1/navigation/composition` endpoint and policy checks.
3. Update AppShell to consume composed nav behind feature flag.
4. Add frontend terminology token provider and fallback strings.
5. Migrate priority labels in planner/report surfaces.
6. Add request/unit/frontend/security tests.
7. Add telemetry for fallback and missing token conditions.
