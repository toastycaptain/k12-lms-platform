# IB Phase 6 Support Content Model

## Scope
This document covers Tasks 126 through 129.

## Content types
The current support layer uses a lightweight code-backed model with reusable primitives for:
- checklist item
- readiness rule
- guided setup card
- empty-state next action
- help disclosure item
- starter template/sample data hint
- mobile triage hint

## Storage decision
Phase 6 keeps implementation guidance in checked-in code and markdown instead of building a CMS. That is intentional because:
- copy still changes with runtime contracts and routes
- support content is tightly coupled to product actions
- future curricula can reuse the primitives without inheriting IB-only articles

## Highest-priority support surfaces
- rollout console
- pilot setup wizard
- pilot readiness console
- import operations console
- job operations console
- mobile triage trays

## Tone rules
- concise and action-oriented
- explicit about owner and next step
- avoid product-marketing phrasing
- explain blockers and remediation in school-operator language

## Training analytics expectations
Help and setup interactions should emit shared interaction metrics so the team can answer:
- which support disclosures get opened most
- whether guided setup reduces blocker counts
- whether support content correlates with lower queue or import failure rates
