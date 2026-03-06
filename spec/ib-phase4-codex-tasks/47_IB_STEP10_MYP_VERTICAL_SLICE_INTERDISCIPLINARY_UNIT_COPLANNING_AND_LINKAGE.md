# Task 47 — IB STEP10 MYP VERTICAL SLICE INTERDISCIPLINARY UNIT CO-PLANNING AND LINKAGE

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 46
- **Run before:** Task 48 deepens the slice into projects and advisor-led milestone workflows
- **Primary mode:** Backend + Frontend

## Objective
Make interdisciplinary planning a real, linked operational flow inside the MYP slice: link subject units, coordinate shared authorship, manage shared milestones/assessment context, and preserve clear navigation between subject-unit and interdisciplinary records.

## Why this task exists now
The slice will feel incomplete and still too course-centric if interdisciplinary planning remains isolated or second-class. This task makes MYP collaboration genuinely multi-subject and operational.

## Current repo anchors
- Outputs from Tasks 24, 25, and 46
- `apps/web/src/features/ib/myp/InterdisciplinaryUnitStudio.tsx`
- subject-unit studio from Tasks 44–46
- collaboration/comment/review infrastructure from Phase 3

## Scope
- link one or more subject units to an interdisciplinary unit
- provide a live interdisciplinary unit route and studio
- support co-planning between teachers with clear ownership/contribution boundaries
- show shared assessment and milestone implications back on linked subject-unit pages
- expose coordinator visibility into interdisciplinary readiness and stalling

## Backend work
- Ensure interdisciplinary-unit records expose:
  - linked subject units
  - lead teacher / collaborator roles
  - workflow state
  - milestone or planning status
  - linked evidence/assessment or project connections where relevant
- Add tailored endpoints if the frontend needs combined payloads that generic record fetches do not provide efficiently.
- Ensure policy rules are correct when users own one linked unit but are only collaborators on the interdisciplinary record.

## Frontend work
- Bind the interdisciplinary studio to live data.
- Add subject-unit side panels or summary cards showing interdisciplinary links and status.
- Build co-planning affordances that do not require users to open multiple browser tabs to understand the relationship.
- Surface return-with-comments/review notes in a way that respects multiple owners.

## UX / interaction rules
- keep linked subject units visible and navigable at all times in the interdisciplinary studio
- make role ownership clear: lead author, collaborator, reviewer
- avoid a disconnected “interdisciplinary annex” feeling
- treat shared milestones and readiness as first-class information, not hidden metadata

## Data contracts, APIs, and model rules
- Do not bury subject-unit linkage only inside document JSON if coordinator summaries and permissions need relational access.
- Keep linked-object summaries consistent between subject-unit and interdisciplinary routes.
- Define whether shared assessment artifacts are referenced or duplicated; prefer linkage over duplication.

## Risks and guardrails
- Do not make interdisciplinary work dependent on brittle client-side joins.
- Do not require teachers to manually sync the same status across subject and interdisciplinary records.
- Do not lose auditability when multiple teachers edit the same interdisciplinary object.

## Testing and verification
- Request specs for linking/unlinking subject units and fetching interdisciplinary detail/summary payloads.
- Frontend integration tests for interdisciplinary route loading, collaborator views, and linked subject-unit context.
- Permission tests across teachers/coordinators.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`
- `ib_myp_interdisciplinary_slice_v1`

## Acceptance criteria
- Interdisciplinary planning is live, linked, collaborative, and visible from both subject-unit and interdisciplinary workspaces.

## Handoff to the next task
- Task 48 deepens the slice into projects and advisor-led milestone workflows.
