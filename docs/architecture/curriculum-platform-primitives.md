# Curriculum Platform Primitives

## Purpose
- Phase 10 Step 8 extracts the reusable parts of the IB build so future American and British packs can reuse engines without inheriting IB-specific route families or programme semantics.

## Shared primitives
- `pack_schema`
  - registry, normalization, pack-store metadata, capability schema
- `document_templates`
  - document type catalog, schema index, inheritance model
- `workflow_templates`
  - shared defaults plus pack-bound workflow bindings
- `reporting_engine`
  - render hooks, archive/release/localization, pack report bindings
- `publishing_engine`
  - evidence capture, story composition, family delivery contract
- `migration_sdk`
  - connector metadata, artifact discovery, shared import manifest
- `governance_console`
  - rollout/readiness/review consoles and readiness rules

## Intentionally IB-specific
- programme route families
- operational record families and programme semantics
- IB report family composers and narrative wording

## Boundary rule
- Shared primitives may know about pack keys, schema versions, bindings, and hooks.
- Shared primitives must not hardcode IB route trees, IB programme labels, or IB-specific record-family semantics.
- IB-specific services may depend on shared primitives, not the reverse.

## Backward compatibility
- Existing IB pack keys and workflow bindings remain canonical.
- The new capability schema is additive metadata on top of the existing pack payload; it does not replace the existing runtime contract.
- Runtime consumers can ignore the new metadata without breaking.
