# Task 48 — IB STEP10 MYP VERTICAL SLICE PROJECTS HUB, PERSONAL/COMMUNITY PROJECTS, MILESTONES, AND ADVISOR FLOWS

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 47
- **Run before:** Task 49 extends the slice into service-as-action evidence, reflection, and approval flows
- **Primary mode:** Backend + Frontend

## Objective
Turn the MYP projects hub into a real operational surface for student projects and advisor/coordinator follow-up, with milestone state, approvals, risk signals, and linked evidence/reflections.

## Why this task exists now
Projects are one of the most tangible MYP coordinator pain points. If the platform cannot help teachers/advisors understand which students are on track, blocked, or overdue, the MYP slice will not feel operationally credible.

## Current repo anchors
- Outputs from Tasks 24, 25, and 47
- `apps/web/src/features/ib/myp/ProjectsHub.tsx`
- project domain models/endpoints from Phase 3
- student and advisor route scaffolding

## Scope
### In scope
- projects hub listing with risk and milestone state
- project detail routes
- advisor assignment and follow-up state
- milestone tracking (proposal, investigation, product/outcome, reflections, review checkpoints, showcase as applicable)
- support for project variants (personal/community or school-configured subset) without forking the entire UX
- linkage to evidence/reflections and student-facing progress surfaces

### Explicitly out of scope
- building a full exhibition/showcase platform beyond slice needs
- broad transcript/report generation for projects

## Backend work
- Verify and complete project relational models so milestone and advisor queries are efficient.
- Add summary endpoints for:
  - my advisees / at-risk projects
  - cohort project health
  - project detail with milestone history, due dates, review notes, linked evidence/reflections
- Ensure student, advisor, coordinator, and guardian permission scopes are explicit and safe.

## Frontend work
- Replace any remaining static project cards with live data.
- Build or finish project detail pages that support advisor review, milestone updates, and student progress visualization.
- Provide list filters that matter in real operations: at-risk, awaiting advisor, overdue milestone, recent student update, ready for review.
- Add quick actions from teacher/advisor home and coordinator console.

## UX / interaction rules
- keep the projects hub primarily about triage and next action, not only status history
- use milestone timelines that are dense but readable
- show risk reasons explicitly (overdue checkpoint, no reflection, missing advisor review, etc.)
- minimize clicks from queue row to actionable detail

## Data contracts, APIs, and model rules
- Project variants should be configuration-driven where possible.
- Milestone state should be relational and queryable, not hidden inside one document blob.
- Advisor review notes and student updates must remain auditable.

## Risks and guardrails
- Do not create separate disconnected flows for teacher, advisor, and coordinator if they all refer to the same underlying project record.
- Do not bury “why this project is at risk” in vague UI labels.
- Do not assume all schools run both personal and community projects in the same year; make this configurable.

## Testing and verification
- Model/request tests for milestone updates, advisor notes, and risk summary endpoints.
- Frontend integration tests for projects hub filtering, detail loading, and next-action workflows.
- Permission tests across student/advisor/coordinator roles.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`
- `ib_myp_projects_slice_v1`

## Acceptance criteria
- The MYP projects hub is now a live advisor/coordinator/student operational surface with actionable milestone and risk state.

## Handoff to the next task
- Task 49 extends the slice into service-as-action evidence, reflection, and approval flows.
