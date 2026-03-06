# Task 45 — IB STEP10 MYP VERTICAL SLICE CONCEPT, CONTEXT, STATEMENT, AND INQUIRY

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 44
- **Run before:** Task 46 adds criteria, ATL, and assessment workflow depth to the slice
- **Primary mode:** Backend + Frontend

## Objective
Operationalize the heart of the MYP unit: key concept, related concepts, global context, statement of inquiry, inquiry questions, and the validations/relationships that make those fields pedagogically coherent rather than cosmetic.

## Why this task exists now
If these fields remain shallow text boxes, the product still feels generic. This task makes MYP planning recognizably MYP in how data is structured, validated, reviewed, and reused.

## Current repo anchors
- Outputs from Tasks 08, 10, and 44
- MYP document schemas in the IB pack
- framework bindings for concepts, contexts, inquiry-question categories, and related taxonomies if configured
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`

## Scope
### In scope
- key concept selection and validation
- related concepts selection and guidance
- global context selection and unpacking aids
- statement of inquiry authoring and revision history
- factual / conceptual / debatable inquiry question structures
- review/readiness rules for concept/context/inquiry completeness
- linked display in coordinator review and student-facing current-unit surfaces later

### Explicitly out of scope
- free-form AI generation replacing teacher authorship
- broad cross-programme concept analytics beyond what this slice needs

## Backend work
- Ensure schema and validation rules can express:
  - allowed concept/context structures
  - required combinations or completeness checks
  - inquiry-question category typing
  - statement-of-inquiry revision and change-tracking where relevant
- Add helper endpoints only if the frontend needs curated suggestions, exemplars, or pick-lists not already available through pack-driven schema metadata.
- Store review notes or field-level return-with-comment anchors for these core fields cleanly.

## Frontend work
- Build/finish dedicated MYP authoring controls for concept/context/inquiry, rather than generic text inputs where specialized UI materially improves speed and clarity.
- Show the relationship among the fields (not as a lecture, but as contextual guidance and validation).
- Make coordinator/peer comments on these fields easy to see and resolve.
- Surface why a unit is blocked if concept/context/inquiry is incomplete or incoherent according to backend rules.

## UX / interaction rules
- use compact, high-signal UI for pickers and question categories
- keep the authoring flow inside the main studio and avoid wizard fatigue
- make guidance dismissible and non-patronizing
- show revision diff for statement-of-inquiry changes when returned by a reviewer

## Data contracts, APIs, and model rules
- inquiry questions should remain queryable/typed; do not flatten them into one blob if later analytics and coordinator review depend on type.
- concept/context fields should align to pack-configured frameworks or enumerations, not ad hoc labels.
- keep enough structure that student/guardian current-unit windows can later render the right subset safely.

## Risks and guardrails
- Do not let the “MYP-ness” of the unit live only in labels while data remains generic.
- Do not make teachers complete overly rigid forms that destroy drafting flexibility.
- Do not duplicate the same concept/context state across multiple disconnected records.

## Testing and verification
- Validation tests for concept/context/question structures.
- Frontend tests for authoring, editing, comments, and blocked-state rendering.
- Regression tests ensuring these fields persist and reload correctly through version changes.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`

## Acceptance criteria
- The MYP unit now has a real concept/context/inquiry backbone that is live, validated, reviewable, and visible where needed.

## Handoff to the next task
- Task 46 adds criteria, ATL, and assessment workflow depth to the slice.
