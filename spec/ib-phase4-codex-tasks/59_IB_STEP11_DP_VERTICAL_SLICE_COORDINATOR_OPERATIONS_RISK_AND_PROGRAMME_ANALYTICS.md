# Task 59 — IB STEP11 DP VERTICAL SLICE COORDINATOR OPERATIONS, RISK, AND PROGRAMME ANALYTICS

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 58
- **Run before:** Task 60 completes the student-facing DP next-action layer
- **Primary mode:** Backend + Frontend

## Objective
Complete the coordinator/admin side of the DP slice: risk dashboards, advisor/supervisor workload and lag, IA/EE/TOK/CAS completion signals, queue-driven decision support, and deep drilldowns into real records.

## Why this task exists now
The DP side earns trust from coordinators when it makes operational risk obvious and actionable. This must be a decision-support surface, not a dense report graveyard.

## Current repo anchors
- programme operations center from Phase 3
- live DP routes and domain models from Tasks 53–58
- review and workflow infrastructure

## Scope
### Coordinator surfaces to operationalize
- IA risk queue
- EE supervision lag / missing checkpoints
- TOK checkpoint lag
- CAS completion or advisor-review backlog
- course-map completeness/teaching readiness where relevant
- advisor/supervisor assignment and load summaries
- drilldown to student-centric DP overview

### Actions to support
- filter by school, cohort, course, teacher, advisor, supervisor
- open the exact at-risk record from the queue
- return / comment / escalate as allowed by role
- export/share concise operational summary where useful

## Backend work
- Build/finalize aggregate endpoints with explicit reason codes for all major DP risks.
- Ensure queries are efficient at district/school scale.
- Add any missing state transitions or escalation/comment events coordinators need.
- Keep audit trails strong for coordinator interventions.

## Frontend work
- Bind DP coordinator console to live aggregates and drilldowns.
- Keep it exception-first and route-consistent.
- Ensure every risk badge or queue row links to the correct underlying record or student overview with context preserved.
- Surface advisor/supervisor workload and lag without overwhelming the screen.

## UX / interaction rules
- emphasize urgency and reason, not just totals
- preserve filters when drilling down and returning
- keep a consistent vocabulary for “overdue,” “awaiting student,” “awaiting advisor,” “awaiting supervisor,” “awaiting coordinator”
- avoid dashboard theatre; every visual needs a clear action path

## Data contracts, APIs, and model rules
- Risk must come from backend reason codes and persisted due-date/workflow state.
- Student-centric drilldown should compose IA/EE/TOK/CAS views from shared identifiers cleanly.
- Coordinator actions must write back to auditable records/events.

## Risks and guardrails
- Do not make coordinators navigate four separate dashboards to understand one student.
- Do not expose internal student notes or authenticity details to the wrong roles.
- Do not leave risk logic duplicated in multiple frontend components.

## Testing and verification
- Request specs for DP aggregate/risk endpoints.
- Frontend integration tests for coordinator queue filtering, drilldown, and context preservation.
- Performance checks under realistic DP cohort sizes.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`

## Acceptance criteria
- Coordinators can understand and act on DP programme risk from one live, high-signal console.

## Handoff to the next task
- Task 60 completes the student-facing DP next-action layer.
