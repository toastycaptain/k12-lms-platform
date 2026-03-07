# IB Phase 9 Coordinator Intelligence and Governance

Covers task range `317` to `327`.

## What shipped
- Intelligence metric-definition model and semantic-layer service.
- Operations-center semantic-layer panel showing metric provenance, summary output, and pilot context.
- API endpoints for listing and creating governed intelligence definitions.

## Governance contract
- Each definition stores metric family, label, definition text, version, source of truth, and threshold config.
- The UI now makes semantic provenance visible instead of treating coordinator intelligence as a black box.
- Pilot context is surfaced next to the semantic layer so coordinators can interpret signals in rollout terms, not only programme terms.

## Why this matters
- Phase 9 shifts coordinator intelligence toward governed decision support.
- Operators can review what signals exist, where they come from, and which pilot context they are meant to support.

## Remaining explicit gaps
- Threshold tuning is still metadata-driven and does not yet include before/after preview of impact.
- Validation workflows for false-positive and false-negative review are not yet a separate persisted model.
