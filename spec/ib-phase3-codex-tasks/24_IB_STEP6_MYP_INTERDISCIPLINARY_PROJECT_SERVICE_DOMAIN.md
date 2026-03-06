# Task 24 — IB STEP6 MYP INTERDISCIPLINARY PROJECT SERVICE DOMAIN

## Position in sequence
- **Step:** 6 — Build POI, exhibition, and interdisciplinary planning as first-class systems
- **Run after:** Task 23
- **Run before:** Task 25 connects MYP interdisciplinary/project/service frontend surfaces to these new live objects.
- **Primary mode:** Backend + Frontend

## Objective
Create real backend domain support for MYP interdisciplinary units, projects, and service-related records, with explicit relationships to subject units, students, advisors, evidence, and approvals.

## Why this task exists now
The MYP frontend already signals interdisciplinary planning and project/service workflows. Those surfaces need first-class domain objects before they can become operational.

## Current repo anchors
- `apps/web/src/features/ib/myp/InterdisciplinaryUnitStudio.tsx`
- `apps/web/src/features/ib/myp/ProjectsHub.tsx`
- `apps/core/app/models` (new MYP domain models)
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor

## Scope
- Design and implement MYP interdisciplinary unit, project, and service-related models.
- Relate interdisciplinary units to subject-unit documents, planning contexts, and collaborators.
- Relate projects/service entries to students, advisors, evidence, and review state.

## Backend work
- Create models such as `MypInterdisciplinaryUnit`, `MypProject`, `MypProjectMilestone`, `MypServiceEntry`, `MypAdvisorReview`, or equivalent.
- Add controllers/endpoints for listing, creating, updating, milestone tracking, review, and summary queries.
- Ensure policy and school scoping are correct for student-associated records.

## Frontend work
- Only minimal frontend changes here: prepare types/hooks and remove assumptions that these objects do not yet exist.

## Data contracts, APIs, and model rules
- Document entity relationships and lifecycle states, especially where project/service records intersect with evidence and student/guardian views later.
- Document whether some of these objects are represented as specialized `CurriculumDocument` types vs dedicated relational models with document links. Use the approach that preserves operational queryability.

## Risks and guardrails
- Do not hide student-associated milestone state inside unqueryable document JSON if coordinator risk and completion views need relational access.
- Do not conflate service entries with general evidence items if service-specific review/approval semantics differ.

## Testing and verification
- Model tests for interdisciplinary/project/service objects and relationships.
- Request specs for project/service endpoints and summary queries.

## Feature flags / rollout controls
- Gate with `ib_interdisciplinary_v1` and/or `ib_myp_projects_v1`.
- Do not build the MYP vertical slice yet; this task only establishes the operational substrate.

## Acceptance criteria
- MYP interdisciplinary/project/service backend foundations now exist.
- The next frontend task can bind the existing MYP surfaces to live data.

## Handoff to the next task
- Task 25 connects MYP interdisciplinary/project/service frontend surfaces to these new live objects.
