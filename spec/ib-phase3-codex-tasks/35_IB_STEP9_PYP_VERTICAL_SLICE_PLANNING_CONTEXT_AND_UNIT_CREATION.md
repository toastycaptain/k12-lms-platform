# Task 35 — IB STEP9 PYP VERTICAL SLICE PLANNING CONTEXT AND UNIT CREATION

## Position in sequence
- **Step:** 9 — Build the first full-stack vertical slice — PYP
- **Run after:** Task 34
- **Run before:** Task 36 deepens the slice inside the live PYP studio, weekly flow, and collaboration environment.
- **Primary mode:** Backend + Frontend

## Objective
Make PYP planning-context selection and PYP unit creation a fully live flow that lands the user directly in the real PYP unit studio with POI-aware metadata and correct route binding.

## Why this task exists now
A vertical slice starts at creation/open. If teachers still need to begin work in generic planners or manually patch context, the slice is not actually end-to-end.

## Current repo anchors
- Output from Task 34
- `apps/web/src/curriculum/contexts/*`
- `apps/web/src/curriculum/documents/CreateDocumentWizard.tsx`
- `apps/web/src/features/ib/pyp/PypUnitStudio.tsx`
- `apps/web/src/app/ib/pyp/*`
- `apps/core/app/controllers/api/v1/planning_contexts_controller.rb`
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`
- POI models/endpoints from Tasks 22–23

## Scope
- Create a PYP-first unit creation flow that starts from the relevant planning context and optionally links the new unit into the POI immediately.
- Ensure the new unit is created with the correct PYP document type/schema and lands on the correct IB route.
- Reduce creation friction: teachers should not have to mentally translate generic document types into PYP-specific objects.

## Backend work
- Add any create-time backend support needed for PYP unit defaults, POI linking, planning-context validation, or route metadata.
- Ensure create responses include all data needed for immediate route transition to the new unit page.

## Frontend work
- Build or refactor a PYP-specific creation launcher/wizard over the generic document creation layer.
- Surface the right fields: academic year, planning context, transdisciplinary theme/POI link if appropriate, title, maybe owner/collaborators if needed.
- Route directly to `/ib/pyp/units/[documentId]` on success.

## Data contracts, APIs, and model rules
- Document create-time defaults for PYP units and when POI linkage is optional vs required.
- Keep the generic creation wizard reusable, but wrap it in a PYP-native entry flow so the experience is not generic-jargony.

## Risks and guardrails
- Do not force teachers through the generic document-type vocabulary if the slice promises a PYP-native flow.

## Testing and verification
- Integration tests for creating a PYP unit and landing on the live route.
- Request specs for PYP unit creation defaults and optional POI linkage.

## Feature flags / rollout controls
- Gate under `ib_pyp_vertical_slice_v1` if the new launcher replaces an old path.
- Do not break generic create flows used by non-IB users.

## Acceptance criteria
- Teachers can start real PYP work from a PYP-native creation flow and land in the right studio immediately.

## Handoff to the next task
- Task 36 deepens the slice inside the live PYP studio, weekly flow, and collaboration environment.
