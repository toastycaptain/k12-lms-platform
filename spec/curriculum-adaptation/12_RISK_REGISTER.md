# Risk Register

## Risk Catalog

## R-ADMIN-BOUNDARY
R-ADMIN-BOUNDARY: curriculum mutation exposed to non-admin users.
Mitigation: strict policy tests + UI authorization tests + endpoint allowlist.

## R-RESOLUTION-DRIFT
Description: Resolver precedence mismatch causes inconsistent profile behavior between screens.
Impact: High
Mitigation:
- Single resolver service used everywhere.
- Resolver contract snapshot tests.
- Include `effective_curriculum_source` in payloads for debugging.

## R-BACKFILL-AMBIGUITY
Description: Some courses cannot be mapped to a school automatically.
Impact: Medium
Mitigation:
- Non-destructive backfill with unresolved report.
- Admin remediation UI list.
- Keep fallback behavior active until resolved.

## R-INTEGRATION-REGRESSION
Description: Integration flows break when context fields are introduced.
Impact: Medium
Mitigation:
- Integration contract tests.
- Backward-compatible optional metadata fields.
- Gradual rollout with provider-specific monitoring.

## R-ROLLOUT-BLAST-RADIUS
Description: Broad flag enablement introduces tenant-wide behavior changes too quickly.
Impact: Medium
Mitigation:
- Cohort rollout by tenant.
- Predefined rollback procedure.
- Real-time monitoring thresholds.
