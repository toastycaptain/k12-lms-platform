# IB Pack Governance

## Versioning decision

- Keep the pack key as `ib_continuum_v1`.
- Promote a new active pack version `2026.2`.
- Mark `2026.1` as `deprecated` but keep it resolvable for pinned documents.

## Why

- Existing IB records already store `pack_key=ib_continuum_v1`; changing the key would create unnecessary migration pressure.
- A new version lets new IB records resolve to the richer pack while older documents remain stable and auditable.

## Naming rules

- `document_type`: `ib_<programme>_<family>` in snake case.
- `schema_key`: `ib.<programme>.<family>@v2`.
- `workflow`: `ib_<family>_cycle`.
- `framework namespaces`: `ib_pyp_*`, `ib_myp_*`, `ib_dp_*`, `ib_standards_practices`.

## Required metadata for future additions

Every new IB pack addition must declare:

- canonical `document_type`
- canonical `schema_key`
- workflow binding
- readiness semantics
- framework bindings
- migration/compatibility note if it supersedes an older type

## Compatibility rules

- `unit_plan`, `lesson_plan`, and `template` remain as temporary compatibility families only.
- New IB-native flows should prefer IB-specific document types (`ib_pyp_unit`, `ib_myp_unit`, `ib_dp_course_map`, etc.).
- Compatibility aliases must be explicit in the pack metadata; do not hide them in ad hoc frontend logic.
