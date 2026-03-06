# Task 26 — IB STEP6 DP IA EE TOK CAS DOMAIN AND STATE MACHINES

## Position in sequence
- **Step:** 6 — Build POI, exhibition, and interdisciplinary planning as first-class systems
- **Run after:** Task 25
- **Run before:** Task 27 binds the DP workspaces and risk screens to these live models.
- **Primary mode:** Backend + Frontend

## Objective
Create real backend domain support and state machines for DP internal assessments, extended essay supervision, TOK checkpoints, and CAS experiences/projects/reviews.

## Why this task exists now
The DP side must be operationally serious to be trusted. Static dashboards are not enough; the system needs structured objects, checkpoints, and review states that coordinators and advisors can monitor.

## Current repo anchors
- `apps/web/src/features/ib/dp/*`
- `apps/core/app/models` (new DP domain models)
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor
- `apps/core/app/services/curriculum/workflow_engine.rb`

## Scope
- Design and implement backend models and workflows for IA, EE, TOK, and CAS operational records.
- Model milestones, due dates, advisor/supervisor notes, review statuses, and completion/risk signals.
- Ensure these objects can be queried by coordinator dashboards and linked to evidence or curriculum documents when relevant.

## Backend work
- Create models such as `DpInternalAssessment`, `DpIaCheckpoint`, `DpExtendedEssayPlan`, `DpExtendedEssayCheckpoint`, `DpTokCheckpoint`, `DpCasExperience`, `DpCasProject`, `DpCasReview`, or equivalent.
- Define state machines/workflows for the major DP record families.
- Expose summary and detail endpoints that support coordinator risk dashboards and teacher/advisor workflows.

## Frontend work
- Only minimal frontend prep here: add types/hooks necessary for later live binding.

## Data contracts, APIs, and model rules
- Document how these records connect to course maps, students, advisors/supervisors, and evidence/stories where relevant.
- Prefer explicit relational milestone/checkpoint tables when coordinator risk queries depend on due dates and missing reviews.

## Risks and guardrails
- Do not reduce all DP core work to one giant JSON field; coordinator risk and completion oversight require queryable checkpoints.
- Do not introduce workflow states that are impossible to explain to teachers/advisors.

## Testing and verification
- Model tests for DP workflows and risk-relevant fields.
- Request specs for DP summary/detail endpoints.
- State-machine tests for major transitions.

## Feature flags / rollout controls
- Gate with `ib_dp_core_live_v1` if needed.
- Do not build the full DP vertical slice yet; that comes later.

## Acceptance criteria
- DP domain models and workflows now exist for live operations.
- The frontend can now bind its DP workspaces to real data in Task 27.

## Handoff to the next task
- Task 27 binds the DP workspaces and risk screens to these live models.
