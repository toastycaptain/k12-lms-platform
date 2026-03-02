# Rollout, Backfill, and Feature Flags

## Feature Flag
- `curriculum_profiles_v1` (tenant-scoped).

## Rollout Sequence
1. Deploy schema fields and resolver in read-safe mode behind flag.
2. Run course-to-school backfill and unresolved-course reporting.
3. Enable admin-only settings/import controls for pilot tenants.
4. Enable derived planner behavior for non-admin roles.
5. Enable integration context propagation.
6. Expand rollout by tenant cohort.

## Migration Sequencing
1. Apply additive migrations.
2. Run non-blocking backfill job.
3. Verify unresolved course count is acceptable.
4. Enable profile resolver enforcement.

## Monitoring
Track by tenant:
- profile resolution fallback rate
- curriculum mutation authorization failures (expected for non-admin)
- planner form error rate post-rollout
- integration error rate by provider

## Rollback Path
1. Disable `curriculum_profiles_v1` feature flag.
2. Keep schema additions and data intact.
3. Revert to fallback resolver behavior only.
4. Keep audit trails for post-incident analysis.

## Guardrails
- No rollout stage may expose curriculum mutation paths to non-admin roles.
- Rollback must be executable without destructive data operations.
