# IB Phase 9 Replacement-Readiness Audit

Closes task `354`.

## Audit statement
The IB platform is materially closer to a credible Toddle or ManageBac replacement after Phase 9 because adoption, migration, reporting, collaboration, speed, intelligence, trust, mobile, and search now share explicit readiness contracts instead of living as disconnected feature clusters.

## Evidence now available in-product
- Pilot cohorts, baseline capture, and support signals are persisted and visible in the rollout console.
- Migration sessions and mapping templates describe cutover progress in product-visible state.
- Reporting cycles and templates exist as operational records rather than hidden assumptions.
- Collaboration workbench data exposes durable events, task follow-up, and rollout transport posture.
- Teacher and specialist benchmark regressions are visible in their daily surfaces.
- Coordinator intelligence now exposes semantic definitions and provenance.
- Guardian and student trust rules are visible as policy.
- Mobile trust is explicit about which workflows are reliable and which remain desktop-first.
- Search operations expose large-school profile configuration and inventory.

## Replacement-readiness conclusion
- `pilot_scale_up` is justified only when the replacement-readiness panel shows green or acceptable yellow status for migration, speed, and mobile.
- `selective_ga_after_gap_closure` is the correct posture when track gaps remain but the system is stable enough for a narrow set of schools.
- `stabilization` remains the right answer if benchmark regressions, degraded mobile workflows, or migration readiness gaps rise back above tolerance.

## Explicit residual gaps
- UAT sign-off history is not yet modeled as a dedicated persisted approval object.
- Source-native migration parsing is still layered on the Phase 8 import primitives.
- Reporting still lacks richer operator actions for hold, resend, and archive controls.
- Collaboration transport remains staged and honest rather than fully realtime.
- Threshold tuning and validation review for intelligence need a deeper governance model.
- Accessibility/trust launch checklists are documented but not yet stored as first-class records.
- Search and job reliability metrics need historical latency and failure-series storage if pilot volume increases.

## Recommended next discussion
Choose between:
1. live multi-school pilot scale-up,
2. selective GA for constrained IB tenants,
3. or a short stabilization cycle focused on the residual gaps above.
