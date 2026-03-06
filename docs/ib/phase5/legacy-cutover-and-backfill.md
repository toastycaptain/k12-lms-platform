# IB Phase 5 Legacy Cutover, Freeze Policy, and Migration Checklist

## Freeze Policy
Effective with Phase 5:
- no new IB feature work should add primary destinations under generic `/plan/**` routes
- no new IB planning feature should be built directly on `UnitPlan`, `LessonPlan`, or generic planner navigation as the user-facing destination
- IB planning creation should start from `CurriculumDocument` and land on a canonical `/ib/**` route
- legacy aliases may exist only for redirect or compatibility windows and must be listed here

## Remaining Legacy Touchpoints
Current intentional overlap points:
- `RouteBuilder` fallback to `/plan/documents/:id` for document types without a canonical IB route mapping yet
- legacy aliases in the route registry, including `/plan/units/:unitId`
- route-resolution redirect handling for `/plan/documents/:id`, `/plan/units/:id`, hash-anchor paths, and `/demo`
- generic `/plan/units/new` still exists as a compatibility entry, but when `ib_documents_only_v1` is enabled it redirects IB users to programme-native create routes

## Backfill and Normalization Checklist
1. Audit rollout drift: deprecated pack count, missing schema keys, missing route hints.
2. Backfill legacy IB unit plans using `ib:backfill_legacy_plans` where safe.
3. Normalize route hints for operational records that can be derived safely.
4. Verify evidence, learning stories, and publishing queue items emit canonical queue-link metadata.
5. Enable `ib_documents_only_v1` for pilot schools only after legacy route counts are near zero.
6. Remove deprecated aliases after pilot readiness and support burden are acceptable.

## Manual Remediation Buckets
Ticket for manual review when any of these are true:
- missing `curriculum_document_id` cannot be inferred safely
- missing `curriculum_document_version_id` would require guessing the authoritative version
- legacy record shape does not match the pack/schema contract
- route hint exists but points to a no-longer-supported destination

## Cutover Standard
A school is ready for documents-only IB mode when:
- route readiness is canonical for active IB documents/records
- legacy route counts are zero or intentionally waived
- programme settings are complete
- review governance queues are school-scoped and explainable
- evidence/publishing queues resolve to canonical routes
