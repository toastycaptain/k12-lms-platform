# IB Phase 9 Pilot Adoption and Launch Operations

Covers task range `259` to `268`.

## What shipped
- Pilot cohort persistence via `IbPilotProfile`, `IbPilotBaselineSnapshot`, and `IbPilotFeedbackItem`.
- Pilot metric and archetype service layer in `apps/core/app/services/ib/pilot`.
- Rollout-console UI panels for pilot cohort creation, baseline capture, launch-week support views, and support feedback logging.
- Replacement-readiness snapshots now include pilot-goal checks and track-level follow-up guidance.

## Operational contract
- Pilot schools are represented by explicit archetypes: `small_pyp`, `continuum`, `dp_heavy`, and `specialist_heavy`.
- Success metrics are stored with the cohort instead of being inferred ad hoc during rollout.
- Baseline capture uses live platform data from documents, evidence, reporting, collaboration, and family read-state.
- Support signals are grouped into launch-day, reporting-week, and moderation-week queues so operators can separate startup friction from normal usage.

## UI surfaces
- Rollout console now exposes:
  - pilot cohort creation
  - one-click baseline capture
  - launch support signals
  - latest feedback queue
  - replacement-readiness summary and next-step recommendation

## Readiness implication
- The adoption track is no longer a doc-only exercise.
- The system now stores the pilot charter, current support burden, and replacement-readiness follow-up state in product-visible contracts.

## Remaining explicit gaps
- UAT sign-off actors and school-specific approval history are not yet modeled as a separate record set.
- Support feedback routing is intentionally lightweight and should be upgraded if pilot support volume grows across multiple schools.
