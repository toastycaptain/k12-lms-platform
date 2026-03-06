# Task 43 — IB STEP10 MYP VERTICAL SLICE ROUTE TREE, CONTEXT ENTRY, AND CREATION

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 42
- **Run before:** Task 44 binds the real MYP subject-unit studio to live documents and workflows
- **Primary mode:** Backend + Frontend

## Objective
Make MYP slice entry and creation fully real: canonical route tree, subject-group-aware planning-context selection, MYP-native create/open flows, and direct landing into the correct live record.

## Why this task exists now
If teachers must start in generic planners or dead-end launchers, the slice is not truly operational. The slice must begin with a clean, programme-native way to open the right record immediately.

## Current repo anchors
- Output from Task 42
- `apps/web/src/app/ib/myp/*`
- `apps/web/src/curriculum/contexts/*`
- `apps/web/src/curriculum/documents/CreateDocumentWizard.tsx`
- `apps/web/src/features/ib/myp/*`
- `apps/core/app/controllers/api/v1/planning_contexts_controller.rb`
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`

## Scope
### Route tree to finalize
Implement or confirm canonical routes such as:
- `/ib/myp/units/[documentId]`
- `/ib/myp/interdisciplinary/[recordId]`
- `/ib/myp/projects/[projectId]`
- `/ib/myp/service/[serviceEntryId]`
- `/ib/myp/coverage`
- `/ib/myp/review`
- `/ib/myp/students/[studentId]/projects/[projectId]` where useful and permission-safe

### Creation flows to implement
- create subject unit from teacher console, course/planning context, or curriculum workspace
- create or seed interdisciplinary unit from one or more subject units
- create/open project record from student/advisor/coordinator contexts
- create service entry from a unit or as stand-alone student/service workflow according to school config

## Backend work
- Ensure create endpoints accept and validate the MYP-specific metadata needed at creation time:
  - academic year
  - planning context / course / subject group
  - programme year / grade
  - school-scoped defaults
  - document type
  - optional linked unit(s), project variant, or service seed
- Return route metadata and enough canonical identifiers for the frontend to transition directly to the correct live page.
- Add helper endpoints if needed for “eligible linked units,” “student advisor defaults,” or “project variant availability by school/programme year.”

## Frontend work
- Build MYP-native launchers/wizards over the generic creation layer.
- Ensure the language never exposes raw generic document jargon when a teacher is in an MYP-specific flow.
- Support fast starts from:
  - teacher console
  - MYP workspace landing
  - coordinator review/coverage pages
  - student/advisor project contexts
- Route directly to the created record on success with the right sidebar/section open.

## UX / interaction rules
- minimize required inputs for the happy path; advanced options can live behind “More settings” or similar
- remember recent planning context and subject group where safe
- show linked-object consequences early (for example, creating an interdisciplinary unit will expect at least two linked subject units)
- never dump the user back to a generic listing after create

## Data contracts, APIs, and model rules
- Define which create flow produces a `CurriculumDocument` immediately and which create flows may create a dedicated relational record first (for example, certain project records) before linking documents.
- Ensure the route and payload semantics are stable enough that later tasks can assume them.
- Keep school scoping and role checks explicit: not every teacher can create every project/advisor-linked record.

## Risks and guardrails
- Do not allow one ambiguous “Create MYP item” flow to spawn unrelated objects with unclear outcomes.
- Do not make the teacher choose between too many record types without contextual recommendation.
- Do not assume every school uses the same project structure; support configured variants.

## Testing and verification
- Request specs for creation endpoints and route metadata.
- Frontend integration tests for each MYP create flow and route landing.
- Permission tests covering teacher vs coordinator vs advisor creation rights.

## Feature flags / rollout controls
- umbrella: `ib_myp_vertical_slice_v1`
- sub-flags: `ib_myp_interdisciplinary_slice_v1`, `ib_myp_projects_slice_v1`, `ib_myp_service_slice_v1`

## Acceptance criteria
- A teacher/coordinator/advisor can create or open the right MYP object through a programme-native flow and land on the correct live route immediately.

## Handoff to the next task
- Task 44 binds the real MYP subject-unit studio to live documents and workflows.
