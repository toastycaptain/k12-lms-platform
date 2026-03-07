# IB Phase 6 Mobile Priority and QA Matrix

## Scope
This document covers Tasks 135 through 139.

## Must-work mobile actions
### Teacher
- review evidence inbox
- open reflection/evidence quick actions
- triage family publishing queue

### Coordinator / admin
- check rollout blockers
- refresh readiness
- review exception and queue backlog summaries

### Specialist / advisor
- open contribution queues
- review follow-up records and next actions

## Responsive baseline
- mobile trays surface only the highest-signal actions
- quick actions must fit narrow layouts without hover dependence
- empty states and support copy need to stay actionable on phone widths

## Recovery expectations
- offline or network loss should queue safe mutations when supported
- pending/retry state must remain visible after reconnect
- import staging and mapping should fail loudly rather than silently dropping operator input

## QA budget
Before release candidate sign-off, verify:
- rollout console on narrow widths
- readiness filtering on narrow widths
- evidence and publishing quick actions on narrow widths
- no hover-only affordances remain on mobile-critical surfaces
- basic keyboard and screen-reader affordances remain intact
