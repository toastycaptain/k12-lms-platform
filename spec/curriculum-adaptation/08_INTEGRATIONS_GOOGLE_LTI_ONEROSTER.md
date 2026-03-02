# Integration Propagation: Google, LTI, OneRoster

## Objective
Propagate effective curriculum context to integration workflows while keeping resolver authority in core services.

## Cross-Integration Principle
- Core resolver computes effective curriculum context.
- Integrations consume context metadata.
- Integrations do not author or mutate curriculum configuration.

Integrations consume resolved curriculum context only.
No integration surface allows non-admin curriculum overrides or imports.

## Google Workspace / Classroom
- Include `effective_curriculum_profile_key` in add-on attach metadata.
- Include profile context in assignment/template creation metadata where applicable.
- Do not expose profile selection in add-on UI for non-admin users.

## LTI
- Inject resolved context into launch/deep-link metadata where standards/template context is needed.
- Keep existing LTI protocol security and tenancy guarantees.
- Ensure no LTI admin UI path allows non-admin curriculum mutation.

## OneRoster
- Use resolved context for post-sync defaults (when creating mapped artifacts).
- Preserve sync idempotency and tenant scoping.
- Keep sync configuration/admin controls under admin-only governance.

## Failure Handling
- If context resolution fails, integrations must fallback to system-safe profile and log event.
- Integration operation should not crash due to missing optional curriculum metadata.
