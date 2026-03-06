# Task 05 — IB STEP1 DOCUMENT DETAIL ROUTES AND RECORD LOADING

## Position in sequence
- **Step:** 1 — Bind the IB UI to live document flows
- **Run after:** Task 04
- **Run before:** Task 06 will expand the IB pack to express the full set of IB objects the UI expects.
- **Primary mode:** Backend + Frontend

## Objective
Bind all programme-specific detail pages and studios to live record loading using `CurriculumDocument`, `CurriculumDocumentVersion`, `PlanningContext`, and any new programme objects introduced later. The goal is for IB detail pages to become real record pages, not decorative wrappers.

## Why this task exists now
After the route tree exists and all links are real, the next trust gap is record loading. IB studios, workspaces, and dashboards must open real data with breadcrumbs, version state, collaborators, and context instead of static props.

## Current repo anchors
- `apps/web/src/curriculum/documents/DocumentEditor.tsx`
- `apps/web/src/curriculum/documents/hooks.ts`
- `apps/web/src/features/ib/pyp/PypUnitStudio.tsx`
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- `apps/web/src/features/ib/myp/InterdisciplinaryUnitStudio.tsx`
- `apps/web/src/features/ib/dp/DpWorkspaces.tsx`
- `apps/web/src/app/ib/**/*` (new detail pages from Task 02)
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`
- `apps/core/app/controllers/api/v1/curriculum_document_versions_controller.rb`

## Scope
- Define a common pattern for route-level loaders and feature hooks to fetch the right record, versions, links, alignments, workflow state, and planning-context summary.
- Decide when the IB frontend should wrap the generic `DocumentEditor` and when it should compose its own programme-specific editing surface over the same APIs.
- Ensure breadcrumbs, tabs, side rails, and context chips all derive from the loaded record.
- Prepare the frontend for later comments, collaborators, evidence links, and review notes without requiring another route refactor.

## Backend work
- Extend document/show endpoints or add specialized `ib/documents/:id/summary` endpoints if the generic document payload is insufficient for IB surfaces.
- Expose lightweight includes for `current_version`, `planning_context`, workflow, relationship counts, collaborator summary, and readiness status if available.
- Add request-level safeguards so a record cannot be opened cross-school or cross-tenant even if a user guesses the ID.

## Frontend work
- Create hooks such as `useIbDocumentWorkspace` or programme-specific wrappers that aggregate the document, context, versions, workflow actions, and related summaries.
- Refactor `PypUnitStudio`, `MypUnitStudio`, `InterdisciplinaryUnitStudio`, and `DpWorkspaces` to receive real document data instead of internal mock objects.
- Ensure there is always a deterministic fallback state for missing/archived documents.

## Data contracts, APIs, and model rules
- Document payload shape for detail pages, including `document`, `versions`, `context`, `workflow`, `relationships`, `alignments`, `readiness`, and `actions`.
- Preserve support for generic document editing paths during the transition, but make IB pages the preferred surface when the pack is IB.

## Risks and guardrails
- Do not fork document loading into three unrelated PYP/MYP/DP API stacks unless absolutely necessary; the shared document engine remains the backbone.
- Do not embed version-creation logic directly inside route pages; keep it in feature components/hooks.
- Do not leave breadcrumb/context state hardcoded after the data is live.

## Testing and verification
- Add request specs for expanded document detail payloads or specialized summary endpoints.
- Add frontend integration tests that render programme studios against real SWR mocks instead of internal sample constants.
- Verify breadcrumb and context rendering across PYP, MYP, DP, student, and guardian paths where relevant.

## Feature flags / rollout controls
- Guard the new IB detail binding behind `ib_live_routes_v1` plus any necessary document/detail flag if rollout must be gradual.
- Do not remove generic document editing screens yet; Task 32 handles cutover of legacy/generic plan surfaces for IB users.

## Acceptance criteria
- IB detail routes load real records and context cleanly.
- Programme-specific studios are now clearly backed by `CurriculumDocument` data, even if deeper subsystems (evidence, POI, DP core) are not yet live.
- The next step can safely expand the IB pack because there is now a real record-loading path waiting for richer document schemas.

## Handoff to the next task
- Task 06 will expand the IB pack to express the full set of IB objects the UI expects.
