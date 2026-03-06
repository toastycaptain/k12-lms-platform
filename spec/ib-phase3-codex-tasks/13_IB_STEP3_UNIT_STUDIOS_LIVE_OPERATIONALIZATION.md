# Task 13 — IB STEP3 UNIT STUDIOS LIVE OPERATIONALIZATION

## Position in sequence
- **Step:** 3 — Build the teacher operations layer
- **Run after:** Task 12
- **Run before:** Task 14 adds collaboration comments, review notes, and presence to those live studios.
- **Primary mode:** Backend + Frontend

## Objective
Transform the PYP, MYP, and DP studios from static/illustrative interfaces into live operational editing environments backed by curriculum documents, versions, workflow, and readiness state.

## Why this task exists now
The studios are the heart of the teacher experience. If they remain mostly static or disconnected from versions/workflow/readiness, the product will still feel like a prototype no matter how good the shell looks.

## Current repo anchors
- `apps/web/src/features/ib/pyp/PypUnitStudio.tsx`
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- `apps/web/src/features/ib/myp/InterdisciplinaryUnitStudio.tsx`
- `apps/web/src/features/ib/dp/DpWorkspaces.tsx`
- `apps/web/src/curriculum/documents/DocumentEditor.tsx`
- `apps/web/src/curriculum/schema/SchemaRenderer.tsx`
- `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`
- `apps/core/app/controllers/api/v1/curriculum_document_versions_controller.rb`

## Scope
- Define a shared pattern for IB studio pages: live record header, sticky context rail, autosave/version status, workflow actions, blocked-by/readiness indicators, field-level editing surface, and side panels for comments/relationships/alignments.
- Preserve programme-specific UX while reusing the same underlying document/version APIs.
- Create a clear line between the generic schema renderer and the richer IB studio wrappers so future MYP/DP/PYP enhancements remain maintainable.

## Backend work
- Add any missing lightweight endpoints or includes required for studio readiness, version compare, collaborator summaries, or field comment counts.
- Ensure create-version and transition actions can be triggered from studio pages safely and idempotently.

## Frontend work
- Replace internal static content in each studio with live schema-driven values and real document metadata.
- Use the generic `SchemaRenderer` where appropriate, but wrap it with programme-aware layout, helper copy, and contextual panels so the experience stays IB-native.
- Add version history/compare affordances and real autosave indicators tied to network state rather than fake timers.
- Show publish readiness / blocked-by using pack-driven required fields and workflow rules, not hand-written booleans.

## Data contracts, APIs, and model rules
- Document which studio sections map directly to schema fields, which map to related documents, and which are aggregate summaries.
- Keep the source of truth inside `CurriculumDocumentVersion.content` and related objects; the studios should not invent shadow local schemas.

## Risks and guardrails
- Do not hardcode IB fields in studio components when the pack can describe them.
- Do not hide version creation behind subtle UI; teachers and coordinators need clear state transitions and version awareness.

## Testing and verification
- Integration tests for each studio using live SWR-mocked document payloads.
- Version-create and workflow-transition tests from the UI.
- Accessibility checks for sticky rails, tab lists, comments, and autosave feedback.

## Feature flags / rollout controls
- Flag by workspace if needed (`ib_pyp_studio_live_v1`, `ib_myp_studio_live_v1`, `ib_dp_studio_live_v1`), but prefer a coordinated rollout once stable.
- Do not delete the generic `DocumentEditor` yet; the IB wrappers can coexist during the cutover.

## Acceptance criteria
- The studios now edit live records and expose real workflow/readiness state.
- Teachers can trust the studio as the source of truth for their work.

## Handoff to the next task
- Task 14 adds collaboration comments, review notes, and presence to those live studios.
