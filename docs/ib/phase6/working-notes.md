# Phase 6 Working Notes

## Discovery summary
- Phase 5 already left real IB route trees, rollout/readiness services, evidence/publishing services, standards exports, and coordinator/admin consoles in place.
- CI already runs `apps/web`, `apps/core`, `apps/ai-gateway`, and Playwright, but there was no single pilot-baseline matrix or explicit IB smoke shard documented for operators.
- Release mechanics existed in generic deploy scripts, but pack freeze, feature-flag bundle application, and pilot rollback guidance were still split across deploy docs and ad hoc service knowledge.
- Pilot setup state was still inferred from rollout/readiness booleans instead of a first-class setup domain.
- Import pathways existed for other platform areas, but IB had no staged batch/session domain for dry-run, mapping, execution, and rollback-aware imports.
- Playwright infrastructure already exists and can support IB smoke coverage with deterministic seed helpers.
- Publishing and standards exports already emit audits and telemetry, which makes them good candidates for replay/recovery tooling instead of building a second background-operations system.

## Risks identified before implementation
- Pilot rollout remained too dependent on engineering knowledge instead of admin/coordinator product surfaces.
- Partial failure recovery was under-documented for pack pinning, publishing, and export operations.
- The document-system consolidation still had explicit legacy fallback paths that needed observability and removal gates rather than silent persistence.
- Shared module extraction boundaries were still implicit in the IB code layout.
