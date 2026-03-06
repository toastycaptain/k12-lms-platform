# Task 22 — IB STEP6 PYP POI DOMAIN RELATIONSHIPS AND GOVERNANCE

## Position in sequence
- **Step:** 6 — Build POI, exhibition, and interdisciplinary planning as first-class systems
- **Run after:** Task 21
- **Run before:** Task 23 connects the POI board and exhibition workspace to these live objects.
- **Primary mode:** Backend + Frontend

## Objective
Create a real PYP Programme of Inquiry domain with explicit POI records, theme/year mapping, unit links, specialist contribution expectations, coherence checks, and governance metadata.

## Why this task exists now
The POI is one of the most distinctive parts of the IB product. It cannot remain just a beautiful board over loose unit records if coordinators need actual overlap/gap governance.

## Current repo anchors
- `apps/web/src/features/ib/pyp/ProgrammeOfInquiryBoard.tsx`
- `apps/web/src/features/ib/pyp/ProgrammeOfInquiryGrid.tsx`
- `apps/web/src/features/ib/pyp/ProgrammeOfInquiryDrawer.tsx`
- `apps/core/app/models` (new POI models)
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor

## Scope
- Design PYP POI domain models, relationships, and governance rules.
- Relate POI entries to planning contexts, PYP units, transdisciplinary themes, year levels, specialist contributions, and academic years.
- Support overlap/gap detection inputs that coordinator operations later rely on.

## Backend work
- Create models such as `PypProgrammeOfInquiry`, `PypPoiEntry`, `PypPoiThemeMapping`, or equivalent.
- Associate POI entries with `CurriculumDocument` records for PYP units and perhaps PYP family-window/exhibition objects where relevant.
- Add validations for one-entry-per-theme/year rules if applicable, overlap flags, and academic-year scoping.
- Create API endpoints for listing, creating, updating, filtering, and coherence summaries.

## Frontend work
- Prepare hooks/types for POI live data; deep frontend binding happens in Task 23.

## Data contracts, APIs, and model rules
- POI records should include ownership/governance metadata: coordinator owner, review status, notes, and coherence signals.
- Document how specialist contribution requirements are represented—either as metadata on POI entries or linked expectations records.

## Risks and guardrails
- Do not store POI governance only inside a unit document’s JSON fields; the POI needs its own queryable object model.
- Do not assume one schoolwide POI with no academic-year scoping.

## Testing and verification
- Model tests for POI creation, unit linkage, and coherence checks.
- Request specs for POI endpoints and summary payloads.

## Feature flags / rollout controls
- Gate behind `ib_poi_v1` until live board binding is complete.
- Do not make POI governance dependent on exhibition or family subsystems being finished.

## Acceptance criteria
- There is now a real backend object for the Programme of Inquiry.
- Task 23 can bind the board and exhibition workflows to live POI data.

## Handoff to the next task
- Task 23 connects the POI board and exhibition workspace to these live objects.
