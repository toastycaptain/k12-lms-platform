# Task 30 — IB STEP8 IB DOCUMENT SYSTEM TARGET ARCHITECTURE AND CUTOVER PLAN

## Position in sequence
- **Step:** 8 — Consolidate the planning stack
- **Run after:** Task 29
- **Run before:** Task 31 handles backend migration/backfill from legacy plan objects into curriculum documents for IB.
- **Primary mode:** Backend + Frontend

## Objective
Write and implement the target-state architecture for IB planning so `CurriculumDocument` becomes the primary system of record for IB mode, with a clear cutover plan away from legacy plan objects.

## Why this task exists now
The repository now contains both legacy plan objects and the newer curriculum document architecture. As the IB side becomes more operational, ambiguity between those systems will create bugs, duplicated work, and broken expectations.

## Current repo anchors
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/unit_plan.rb` and related legacy planning models
- `apps/web/src/app/plan/*`
- `apps/web/src/app/ib/*`
- `apps/web/src/curriculum/documents/*`
- `apps/web/src/features/ib/*`

## Scope
- Define the target state for IB mode: which objects live only as curriculum documents, what remains generic/shared, and how legacy routes behave for IB users.
- Document and then implement a cutover plan that avoids breaking non-IB curricula.
- Decide the cutover order and transitional adapters required.

## Backend work
- Write an architecture note under `spec/ib-phase3-codex-tasks/support/ib-document-cutover.md` describing target-state ownership.
- Add any backend toggles/adapters required so IB users can be routed to document-backed flows while American/British or legacy users remain unaffected.

## Frontend work
- Prepare frontend route and navigation cutover rules for later implementation in Tasks 31–32.
- Inventory any components still tied to legacy plan objects in IB mode.

## Data contracts, APIs, and model rules
- Document a source-of-truth matrix: for every IB route/object, specify whether the source of truth is `CurriculumDocument`, evidence subsystem, POI subsystem, project/core subsystem, or standards/practices packet.
- Explicitly state what remains legacy-only and why.

## Risks and guardrails
- Do not break American or British planning flows while consolidating IB.
- Do not leave target-state decisions implicit in code only; they must be documented.

## Testing and verification
- Architecture review checklist in the repo.
- Smoke tests that ensure non-IB flows still work after introducing cutover flags/adapters.

## Feature flags / rollout controls
- Introduce a master cutover flag such as `ib_documents_only_v1`.
- Do not flip the flag globally in this task; just implement the target-state architecture and scaffolding.

## Acceptance criteria
- There is a documented and implemented target-state plan for IB planning architecture.
- Tasks 31–33 can now migrate data, cut over the frontend, and unify workflow engines safely.

## Handoff to the next task
- Task 31 handles backend migration/backfill from legacy plan objects into curriculum documents for IB.
