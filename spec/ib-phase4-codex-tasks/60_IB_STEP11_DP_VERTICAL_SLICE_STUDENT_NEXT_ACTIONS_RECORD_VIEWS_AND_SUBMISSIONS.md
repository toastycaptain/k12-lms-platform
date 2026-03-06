# Task 60 — IB STEP11 DP VERTICAL SLICE STUDENT NEXT ACTIONS, RECORD VIEWS, AND SUBMISSIONS

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 59
- **Run before:** Task 61 completes the guardian/family support layer
- **Primary mode:** Backend + Frontend

## Objective
Create a unified DP student experience that surfaces the right next actions across course map, IA, EE, TOK, and CAS without drowning the student in separate silos.

## Why this task exists now
A common weakness of older school platforms is that students must hunt through many pages to know what actually matters. This task makes the DP slice genuinely useful to students day to day.

## Current repo anchors
- outputs from Tasks 53–59
- `apps/web/src/features/ib/student/*`
- DP record pages and student dashboard surfaces
- submission/evidence hooks already used elsewhere in the app

## Scope
### Student-facing outcomes
- unified “what needs my attention now” dashboard for DP
- route-consistent record views for IA, EE, TOK, and CAS
- submission/update flows or progress updates appropriate to each record type
- feedback / returned-for-action / blocked reason visibility
- calm but serious deadline presentation

### Explicitly out of scope
- building a fully separate student app or redesigning the entire global student shell

## Backend work
- Finalize student-facing summary endpoints that compose next actions across DP record families.
- Ensure student-visible feedback/reason codes are appropriate and filtered correctly.
- Add any missing lightweight update endpoints needed for student checkpoint progress, reflection submission, or record acknowledgment where appropriate.

## Frontend work
- Bind DP student dashboard and record views to live data.
- Make the dashboard rank and group next actions sensibly.
- Ensure every next-action card deep-links directly to the right record and subsection.
- Keep the student UI calm, readable, and not admin-flavoured.

## UX / interaction rules
- prioritize urgency + next step + due date + context
- avoid making students decode coordinator or teacher workflow jargon
- present blocked states with clear remedies where possible
- keep the number of main action patterns small and consistent across IA/EE/TOK/CAS

## Data contracts, APIs, and model rules
- The student dashboard should be driven by backend-prioritized reason codes or sortable action data, not ad hoc frontend heuristics alone.
- Keep teacher/advisor-only notes hidden.
- Ensure update/submission flows preserve auditability and timestamps.

## Risks and guardrails
- Do not mirror the coordinator dashboard in student form.
- Do not mix unrelated DP obligations into one cluttered mega-list without prioritization.
- Do not leave students without a clear way back to the unified dashboard after handling one action.

## Testing and verification
- End-to-end tests for student DP next-action happy paths where feasible.
- Frontend integration tests for deep-linking, filtered feedback visibility, and submission/update actions.
- Permission tests for student role scoping.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`

## Acceptance criteria
- Students can see and act on the right DP next actions from a unified live dashboard and record system.

## Handoff to the next task
- Task 61 completes the guardian/family support layer.
