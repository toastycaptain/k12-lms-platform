# Task 15 — IB STEP3 SPECIALIST MODE AND SHARED OWNERSHIP

## Position in sequence
- **Step:** 3 — Build the teacher operations layer
- **Run after:** Task 14
- **Run before:** Task 16 now builds the coordinator/admin operations layer on top of the live teacher-facing foundations.
- **Primary mode:** Backend + Frontend

## Objective
Build a true specialist workflow and shared-ownership model so specialist teachers can contribute across units, grades, and programmes without being forced into homeroom-style ownership patterns.

## Why this task exists now
Specialist pain is a major weakness in many school platforms. This task turns shared ownership into a first-class workflow rather than assuming every unit is owned by one homeroom teacher.

## Current repo anchors
- `apps/web/src/features/ib/specialist/*`
- `apps/web/src/features/ib/home/TeacherActionConsole.tsx`
- `apps/web/src/features/ib/pyp/PypUnitStudio.tsx`
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- `apps/core/app/models` (collaborator/assignment additions)
- `apps/core/app/controllers/api/v1/ib/*`

## Scope
- Define specialist-specific views of the work: units needing contribution, this-week schedule, requested evidence, contribution-only actions, and owned vs contributed separation.
- Extend collaborator models to support roles like owner, co-planner, specialist contributor, reviewer, and advisor where relevant.
- Design contribution flows that let specialists add resources, notes, evidence moments, or feedback without taking over full unit ownership.

## Backend work
- Extend collaborator/assignment models and queries to support specialist filters and contribution permissions.
- Create specialist dashboard/query endpoints that aggregate across planning contexts and units.
- Support `needs specialist input` / `specialist requested` / `specialist responded` states where useful.

## Frontend work
- Bind `SpecialistDashboard`, `SchoolWeekPlanner`, `MultiUnitAttachFlow`, and `SpecialistContributionDrawer` to live data.
- Provide fast “comment-only”, “resource-only”, “evidence-only”, and “acknowledge request” actions for specialists.
- Keep the UI low-friction for teachers who move across many grade levels.

## Data contracts, APIs, and model rules
- Make sure specialist contribution does not require editing the entire base document if a narrower contribution object or comment is sufficient.
- Document how specialist contributions appear in teacher home, coordinator operations, and POI governance later.

## Risks and guardrails
- Do not treat specialists as second-class read-only viewers if the product expects active contribution.
- Do not duplicate the same data in a separate specialist-only shadow model unless required for performance.

## Testing and verification
- Endpoint/service tests for specialist queries and collaborator role filters.
- Frontend tests for the specialist dashboard, contribution drawer, and multi-unit attach flow.
- Role-based permission tests ensuring specialists cannot perform owner-only publish or archival actions unless explicitly allowed.

## Feature flags / rollout controls
- Feature-flag with `ib_specialist_mode_v1` if needed.
- Do not make specialist mode dependent on every later subsystem; it should work with documents/comments first and deepen as evidence/POI go live.

## Acceptance criteria
- Specialists can work across units without high-friction ownership hacks.
- Teacher operations now supports one of the biggest real-world IB workflow pain points.

## Handoff to the next task
- Task 16 now builds the coordinator/admin operations layer on top of the live teacher-facing foundations.
