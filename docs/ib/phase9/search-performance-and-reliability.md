# IB Phase 9 Search, Performance, and Reliability

Covers task range `347` to `354`.

## What shipped
- Search-profile model and API with latency budgets, facet config, ranking rules, and scope rules.
- Search operations surfaced directly inside the IB search dialog so large-school readiness is inspectable where search is used.
- Replacement-readiness closeout now includes search/performance as its own track and next-step recommendation.

## Search and reliability contract
- Search profiles allow the team to describe large-school query expectations explicitly rather than hardcoding them.
- Entity inventory and result groups are exposed beside the saved-lens workflow, connecting operational search tuning to the user-facing search surface.
- Final readiness export includes pilot profile count, migration sessions, report cycles, collaboration load, and benchmark regressions.

## Why this matters
- Phase 9 ends with search and operational readiness on the same footing as migration, reporting, and trust.
- The final audit can now call out whether the system is ready for pilot scale-up or should remain in stabilization.

## Remaining explicit gaps
- Background-job recovery tooling is still represented by metrics and docs rather than a dedicated operator action center.
- Query profiling is stored as profile configuration and inventory context, not yet as historical latency-series data.
