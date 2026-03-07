# IB Phase 6 Shared Platform Extraction Design

## Scope
This document covers Tasks 145 through 148.

## Shared primitives proven by IB
- pilot setup state and guided mutation service
- readiness rules engine + checklist rendering
- import batch/row staging model
- job operations and replay controls
- support-content primitives for empty states, checklists, and help disclosures
- telemetry helpers and pilot analytics buckets
- mobile triage tray patterns
- canonical document-route adapters

## Extraction rule
Shared layers stay pack-neutral. Curriculum-specific behaviour belongs in adapters, route registries, schema maps, and content definitions rather than conditionals spread through shared primitives.

## Adapter seams to preserve
- route resolution
- document subtype/schema mapping
- readiness section definitions
- programme-specific quick actions
- analytics surface labels

## Reuse readiness rubric
A module is reusable only when:
- tenant/school scoping is explicit
- IB-specific labels are moved behind configuration or adapters
- shared tests cover the neutral contract
- IB tests still prove the specialised behaviour after extraction

## Explicit non-goal
This extraction plan does not start American or British feature work. It only makes those future phases start from cleaner platform seams.
