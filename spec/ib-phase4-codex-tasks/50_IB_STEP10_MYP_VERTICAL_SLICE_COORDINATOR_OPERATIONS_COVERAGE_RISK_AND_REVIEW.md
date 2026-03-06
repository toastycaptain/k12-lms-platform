# Task 50 — IB STEP10 MYP VERTICAL SLICE COORDINATOR OPERATIONS, COVERAGE, RISK, AND REVIEW

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 49
- **Run before:** Task 51 completes the slice on student/guardian outcomes, telemetry, and release
- **Primary mode:** Backend + Frontend

## Objective
Complete the MYP slice from the coordinator side: review queues, coverage summaries, risk summaries, drilldowns, and exception-first oversight across units, interdisciplinary work, projects, and service.

## Why this task exists now
If the slice only helps teachers but not coordinators, it is still incomplete. The MYP coordinator needs one place to understand programme health without drowning in screens or spreadsheets.

## Current repo anchors
- programme operations center from Phase 3
- MYP route tree and live surfaces from Tasks 43–49
- review infrastructure, comment/return flows, and standards/framework query primitives

## Scope
### Coordinator surfaces to operationalize
- MYP review queue
- criteria coverage and imbalance
- ATL coverage/distribution
- global context balance
- interdisciplinary unit status
- project milestone risk
- service participation / pending validation
- units returned with comments / awaiting coordinator action

### Actions to support
- approve / return with comments
- drill into at-risk student/project/unit/service record
- filter by school, programme year, subject group, teacher, advisor
- export or share concise summaries where useful

## Backend work
- Build or finalize aggregate endpoints that return already-shaped data for the MYP coordinator console.
- Include explicit reason codes behind every risk or “awaiting action” badge.
- Ensure queries are school-scoped and efficient under district/multi-school usage.
- Add any missing workflow transitions or review note persistence the coordinator views need.

## Frontend work
- Bind the MYP coordinator pages to live aggregates and drilldowns.
- Keep the UI exception-first and high-signal.
- Make every queue row and chart/card deep-link to the correct underlying record with preserved filters/context.
- Surface policy-safe student detail only when the coordinator truly has permission.

## UX / interaction rules
- default to “what needs attention now,” not “everything at once”
- show why an item is at risk in human-readable language tied to real reason codes
- preserve filter context during drilldown/back navigation
- avoid dashboard theatre; every number should lead somewhere useful

## Data contracts, APIs, and model rules
- Risk and coverage should be computed from persisted data, not inferred only in the browser.
- Keep summary payloads small enough for fast dashboards but rich enough to drive drilldowns.
- Review actions must write auditable events/comments back to the source record.

## Risks and guardrails
- Do not recreate a cluttered admin console with no prioritization.
- Do not make coordinators jump from one queue page to another to understand one student or one unit.
- Do not expose family-visible data controls in places intended only for internal coordinator decision support.

## Testing and verification
- Request specs for MYP coverage/risk aggregates and review transitions.
- Frontend integration tests for queue filtering, drilldown persistence, and returned-with-comments flows.
- Performance checks for coordinator dashboards under realistic data volume.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`

## Acceptance criteria
- Coordinators can understand MYP programme health, take review actions, and follow risk signals from real live data without leaving the slice context.

## Handoff to the next task
- Task 51 completes the slice on student/guardian outcomes, telemetry, and release.
