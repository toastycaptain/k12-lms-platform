# Task 07 — IB STEP2 PYP PACK DOCUMENT TYPES AND SCHEMAS

## Position in sequence
- **Step:** 2 — Make the IB pack much richer
- **Run after:** Task 06
- **Run before:** Task 08 now extends the same pack richness to MYP.
- **Primary mode:** Backend + Frontend

## Objective
Add full PYP pack support: document types, JSON schemas, UI schemas, relationships, workflow bindings, framework bindings, and readiness metadata for the major PYP planning and communication objects.

## Why this task exists now
The PYP is the first operational slice later in this pack, so the pack must describe it fully before the PYP vertical slice begins. Right now the PYP surface exceeds what the pack can express.

## Current repo anchors
- Output from Task 06
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor pack file
- `apps/web/src/features/ib/pyp/*`
- `apps/core/app/services/curriculum/document_factory.rb`
- `apps/core/app/services/curriculum/pack_schema_resolver.rb`

## Scope
- Define PYP document types such as `ib_pyp_programme_of_inquiry`, `ib_pyp_unit`, `ib_pyp_weekly_flow`, `ib_pyp_family_window`, and `ib_pyp_exhibition`.
- Create full `data_schema` and `ui_schema` definitions for each PYP document type.
- Express document relationships explicitly: POI contains/links to units; a unit links to weekly flow, family window, evidence, exhibition, and specialist contributions.
- Add readiness rules and required-field groupings that later tasks can use to show “publish-ready / blocked-by” states.

## Backend work
- Update pack schema support if PYP UI schema needs richer widgets such as repeatable sections, timeline rows, evidence link pickers, or field groups.
- Ensure the document factory and schema resolver can create and validate the new PYP types.
- Add schema tests for representative valid and invalid PYP payloads.

## Frontend work
- Update any frontend pack typing/helpers if they need to understand new PYP document types and UI schema constructs.
- Do not yet implement full UI binding here; the goal is to make the pack expressive enough so later tasks can consume it.

## Data contracts, APIs, and model rules
- Include PYP-specific fields such as transdisciplinary theme, central idea, lines of inquiry, learner profile, approaches to learning, prior learning, provocations, inquiry sequence, evidence moments, student action, reflection, specialist contribution expectations, family window summary, and exhibition linkage.
- Include framework bindings for PYP transdisciplinary themes, learner profile attributes, key concepts, and any school-defined ATL/approaches taxonomies if applicable.
- Define workflow bindings so PYP units, weekly flow docs, family windows, and exhibition artefacts can move through review and publish states cleanly.

## Risks and guardrails
- Do not compress multiple PYP concerns into one giant document if they have different workflows or owners.
- Do not force family-facing text and internal planning notes into the same field set if visibility rules differ.

## Testing and verification
- Pack validation tests must load PYP schemas successfully.
- Document-creation tests must create each new PYP document type through the factory using the pack.
- Invalid examples should fail loudly with understandable schema errors.

## Feature flags / rollout controls
- Keep the new PYP types behind `ib_pack_v2` until the frontend is ready to consume them.
- Do not migrate existing starter PYP-like unit documents in this task; Task 31 handles bulk migration/backfill.

## Acceptance criteria
- The pack can describe the PYP unit studio, weekly flow, family window, POI, and exhibition without UI-only assumptions.
- Future PYP UI tasks can fetch schema metadata from the pack instead of hardcoding everything inside React components.

## Handoff to the next task
- Task 08 now extends the same pack richness to MYP.
