# 06 Schema Driven Planner Editors

> Shared Implementation Requirements
> - Keep all API routes under `/api/v1`.
> - Every persisted table must include `tenant_id` (`NOT NULL`) and tenant indexes.
> - All read/write queries must be scoped to `Current.tenant` (or explicit tenant filter for controlled `unscoped` admin jobs).
> - Enforce Pundit authorization on every controller action.
> - Do not implement out-of-PRD features (real-time co-editing, video conferencing, SIS replacement, proctoring, marketplace).

## Objective
Replace hardcoded planner forms with schema-driven rendering so IB/US/UK packs can define planner structure without separate code forks.

## Current State and Gap
Current unit/template editors are hardcoded in React components and cannot be molded by profile pack schema.

Grounding references:
- [`apps/web/src/app/plan/units/[id]/page.tsx`](../../apps/web/src/app/plan/units/[id]/page.tsx)
- [`apps/web/src/app/plan/templates/[id]/page.tsx`](../../apps/web/src/app/plan/templates/[id]/page.tsx)
- [`apps/web/src/app/plan/units/new/page.tsx`](../../apps/web/src/app/plan/units/new/page.tsx)
- [`apps/core/app/controllers/api/v1/unit_plans_controller.rb`](../../apps/core/app/controllers/api/v1/unit_plans_controller.rb)
- [`apps/core/app/controllers/api/v1/templates_controller.rb`](../../apps/core/app/controllers/api/v1/templates_controller.rb)

Gap summary:
- Fixed form layout and field lists.
- No declarative validation/rendering layer.
- No controlled component registry for pack composition.

## Scope
### In Scope
- Define planner schema DSL.
- Define backend schema delivery API.
- Define frontend schema renderer and component registry.
- Define migration path from hardcoded screens.

### Out of Scope
- Workflow engine internals (File 09).
- Navigation composition (File 07).

## Planner Schema DSL
### Core structure
```json
{
  "object": "unit_plan",
  "variant": "ib_myp_unit",
  "tabs": [
    {
      "id": "overview",
      "label": "Overview",
      "sections": [
        {
          "id": "identity",
          "label": "Identity",
          "fields": [
            {"id": "title", "component": "text_input", "required": true},
            {"id": "statement_of_inquiry", "component": "text_area", "required": true}
          ]
        }
      ]
    }
  ],
  "validation": {
    "required_fields": ["title", "statement_of_inquiry"],
    "max_lengths": {"title": 180}
  }
}
```

### Allowed component registry
- `text_input`
- `text_area`
- `rich_text`
- `tag_selector`
- `single_select`
- `multi_select`
- `date_range`
- `standards_linker`

No arbitrary component names allowed.

## Data Model Changes
No new persisted domain model required for v1 implementation if schema sourced from pack.
Optional additive table for tenant overrides (future): `planner_schema_overrides` with `tenant_id`.

## API and Contract Changes
### New endpoint
- `GET /api/v1/planner/schema`

Query params:
- `object` (`unit_plan`, `lesson_plan`, `template`)
- `course_id` (optional, preferred for effective context)
- `variant` (optional override for admin preview)

### Response payload example
```json
{
  "object": "unit_plan",
  "effective_profile_key": "ib_continuum",
  "effective_profile_version": "2026.1",
  "schema": {
    "tabs": [
      {"id": "overview", "label": "Overview", "sections": []}
    ]
  }
}
```

### OpenAPI updates
- Add planner schema endpoint and response schema to:
  - [`apps/core/config/openapi/core-v1.openapi.yaml`](../../apps/core/config/openapi/core-v1.openapi.yaml)
  - [`packages/contracts/core-v1.openapi.yaml`](../../packages/contracts/core-v1.openapi.yaml)

## UI and UX Behavior Changes
### Frontend architecture
1. Create `PlannerSchemaRenderer` component in `apps/web/src/components`.
2. Keep `AppShell` and route structure unchanged initially.
3. Replace per-field hardcoded blocks in unit/template pages with renderer-driven layout.
4. Show fallback banner when schema invalid and revert to legacy fields.

### Accessibility requirements
- All generated inputs must preserve labels, error text, and keyboard navigation.
- Generated layouts must pass existing accessibility test standards.

## Authorization and Security Constraints
- Schema endpoint requires authenticated user and must resolve tenant-scoped profile context.
- Non-admin users cannot request admin-only preview variants.
- Server validates schema references before returning payload.

## Rollout and Migration Plan
1. Build schema endpoint with read-only behavior.
2. Implement renderer behind feature flag `planner_schema_renderer_v1`.
3. Migrate unit editor first, then template editor, then lesson editor.
4. Keep legacy hardcoded UI available for fallback until all variants validated.

## Monitoring and Alerts
Metrics:
- `planner_schema.fetch_success_count`
- `planner_schema.fetch_failure_count`
- `planner_renderer.fallback_to_legacy_count`
- `planner_renderer.validation_error_count`

Alerts:
- Legacy fallback > 2% of planner loads for any tenant.
- Schema fetch failures > 1% for 15 minutes.

## Test Matrix
### Unit
- DSL validator accepts valid schema and rejects invalid components.

### Frontend
- Renderer snapshot tests for IB/US/UK variants.
- Accessibility checks for generated forms.

### Request/Contract
- `GET /api/v1/planner/schema` returns correct shape by profile context.

### Regression
- Legacy editor remains functional while flag disabled.

## Acceptance Criteria
1. Unit and template editors can render from pack schema.
2. Component registry enforces allowed components only.
3. Invalid schema falls back to legacy safely.
4. Accessibility and keyboard interaction remain compliant.
5. Non-admin users receive only permitted schema variants.

## Risks and Rollback
### Risks
- Schema complexity can introduce rendering regressions.
- Variant drift between pack and backend validation.

### Rollback
1. Disable `planner_schema_renderer_v1` flag to return to legacy hardcoded editors.
2. Keep schema endpoint available for diagnostics only.
3. Re-enable per tenant after fixes.

## Codex Execution Checklist
1. Define planner schema JSON contract and server-side validator.
2. Implement `GET /api/v1/planner/schema` endpoint.
3. Create frontend `PlannerSchemaRenderer` with approved registry.
4. Integrate renderer into unit editor behind feature flag.
5. Integrate template and lesson editors incrementally.
6. Implement legacy fallback path and user-visible warning.
7. Add contract, unit, frontend, and accessibility tests.
8. Add metrics/alerts for fallback and schema errors.
