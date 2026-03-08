# Phase 10 Extraction Closeout

## Decisions
- Keep the existing curriculum profile payload as the source of truth.
- Add the vnext capability schema as derived metadata, not a replacement file format.
- Reuse current IB services as adapters behind shared curriculum contracts instead of forking new engines.

## Backward-compatibility rules
- IB pack keys, versions, schema keys, and workflow bindings stay unchanged.
- Any consumer already using `CurriculumPackStore.fetch(..., with_metadata: false)` is unaffected.
- Consumers using metadata gain extra fields but do not lose existing ones.

## Follow-up boundary for future phases
- New curriculum packs should implement bindings and templates against the shared capability schema first.
- New programme-specific route trees must stay outside the shared curriculum layer.
- Reporting/publishing/migration/governance engines can be reused across packs, but composition and operational semantics remain pack-owned.

## Manual QA
1. Inspect `/api/v1/curriculum_profiles?runtime=true` and confirm existing pack fields still serialize.
2. Fetch a pack with metadata and confirm `capability_schema` and `primitive_inventory` are present.
3. Generate an IB report and confirm `report_contract.engine_key` is `curriculum_reporting_v1`.
4. Inspect rollout console payload and confirm `shared_console_contract` is present.
