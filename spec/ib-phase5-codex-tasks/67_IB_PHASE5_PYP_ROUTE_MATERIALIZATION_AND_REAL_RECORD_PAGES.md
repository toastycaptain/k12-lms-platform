# Task 67 — PYP Route Materialization and Real Record Pages

## Phase step
1 — Materialize the canonical IB route tree

## Purpose
Materialize the real Next.js pages for PYP-specific routes so teachers, specialists, coordinators,
students, and families can deep-link into live PYP records instead of going through generic shells
or placeholders.

## Current repo anchors
- `apps/web/src/app/ib/`
- `apps/web/src/features/ib/data.ts`
- `apps/core/app/services/ib/support/route_builder.rb`
- `apps/core/app/models/pyp_programme_of_inquiry.rb`
- `apps/core/app/models/pyp_programme_of_inquiry_entry.rb`
- `apps/core/app/models/curriculum_document.rb`

## Deliverables
- Real page files for `/ib/pyp/poi`, `/ib/pyp/units/[unitId]`, `/ib/pyp/units/new`, and `/ib/pyp/exhibition`.
- Page wiring that loads real records, renders the correct shell, and supports direct bookmarking and queue navigation.
- Create/open flows that land on actual pages rather than generic `/plan` pages or mock cards.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Confirm the API can fetch the underlying PYP unit document, associated planning context, POI relationship data, evidence summaries, and coordinator workflow state required by the page.
- Where the API is missing aggregated page payloads, add PYP-specific show endpoints or extend existing document/POI serializers instead of forcing the frontend to stitch together excessive parallel calls.
- Provide route-safe behavior when a PYP unit belongs to a different school, academic year is frozen, or the unit has been archived.

### 3) Frontend work
- Add page files under the canonical PYP route tree and render them with Task 66 page shells.
- Bind `/ib/pyp/units/[unitId]` to the existing PYP studio/editor surface instead of a static feature mock. The studio must read the live `CurriculumDocument`, version info, collaborators, comments, workflow state, and linked POI entry state.
- Bind `/ib/pyp/poi` to live `PypProgrammeOfInquiry` and `PypProgrammeOfInquiryEntry` data. Do not leave it as a static board.
- Bind `/ib/pyp/exhibition` to the operational record / document structures already introduced in earlier phases. If there are remaining model gaps, document them explicitly and implement them in the smallest responsible way.
- Make `/ib/pyp/units/new` create a real `ib_pyp_unit` document through the current document create API and redirect into the canonical detail route upon success.

### 4) Contracts, schema, and API expectations
- PYP pages must be school-aware and must include breadcrumb trails that reflect school + programme + object.
- The PYP unit detail page must accept a document ID and never assume the current user came from the teacher home screen.
- POI board entries must link to their mapped units or an explicit create/new flow when no unit exists.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Page-level tests for direct loading by URL, create-and-redirect behavior, not-found states, and archive states.
- Integration tests proving route builder URLs from backend entities land on valid frontend pages.
- Regression tests proving PYP routes no longer depend on `/demo` URLs.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- Every PYP href produced by the backend resolves to a real page.
- A PYP teacher or coordinator can bookmark and reopen POI, a specific unit, and exhibition.

### 9) Pitfalls and guardrails
- Do not make the PYP page file a thin redirect back to generic plan pages. It must be an IB-native route.
- Do not rely on mock data inside `apps/web/src/features/ib/data.ts` once the page is live.

### 10) Handoff to the next task

Before moving to Task 68, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
