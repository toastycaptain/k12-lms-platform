# Task 66 — Shared IB Page Shell, Route Params, and Breadcrumb Contract

## Phase step
1 — Materialize the canonical IB route tree

## Purpose
Define the shared page-level infrastructure all IB routes will use: param parsing, school-aware page
wrappers, programme-aware breadcrumbs, tab slots, action rails, loading states, error boundaries,
and access-fallback behavior. This prevents every new page from improvising its own shell and
recreating ManageBac-style inconsistency.

## Current repo anchors
- `apps/web/src/app/ib/layout.tsx`
- `apps/web/src/lib/school-context.tsx`
- `apps/web/src/lib/useSchoolSWR.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/curriculum/navigation/registry.ts`

## Deliverables
- A shared IB page shell component system under `apps/web/src/features/ib/layout/` or equivalent.
- Route-param utilities for document routes, operational record routes, standards packet routes, and evidence/story routes.
- Common breadcrumb builders and fallback cards for not-found, forbidden, school mismatch, archived record, and feature-disabled states.
- A clear convention for how page-level components receive entity IDs and how they render skeleton, empty, loading, and degraded states.

## Detailed implementation instructions

### 1) Audit and design before coding

Before changing code, inspect the anchor files, trace the current control flow, and write a short
implementation note inside the PR or working branch notes describing what currently exists, what is
missing, and what assumptions this task is making. Codex should not skip this audit step; it
prevents hidden drift from earlier phases.

### 2) Backend work
- Document the response/error shapes pages should expect for missing records, permission failures, school mismatch, and archived/unsupported route types so frontend handling is deterministic.
- If current API responses are inconsistent, introduce a normalized error envelope convention before deep pages are built.

### 3) Frontend work
- Create shared `IbPageShell`, `IbDetailPageShell`, `IbQueuePageShell`, and `IbCoordinatorPageShell` wrappers with optional right rails and action slots.
- Build `parseDocumentRouteParams`, `parseOperationalRouteParams`, and `parseStandardsRouteParams` helpers. Keep them strongly typed and colocated with route helpers.
- Implement breadcrumb primitives that take a canonical route ID plus loaded entity titles and produce a consistent breadcrumb path.
- Create standard page-state components: `IbPageLoading`, `IbPageNotFound`, `IbPageForbidden`, `IbSchoolMismatchState`, `IbFeatureDisabledState`, `IbArchivedRecordState`.

### 4) Contracts, schema, and API expectations
- Page shells must accept the active school context and must never silently render data from a different school.
- Breadcrumbs must use canonical route helpers from Task 65 rather than freehand labels.
- Pages that depend on a feature flag must render the disabled state, not a blank screen or redirect loop.

### 5) Files to touch or create

- Start with the anchor files above.
- Expect to create or extend page files under `apps/web/src/app/ib/**` and feature modules under `apps/web/src/features/ib/**`.

### 6) Test plan
- Component tests for breadcrumb rendering across PYP/MYP/DP pages.
- Tests proving school mismatch and forbidden states render correctly.
- Tests proving a page shell does not issue requests until required params are present.

### 7) Manual QA checklist

- Verify school scoping by switching schools and confirming the page/data changes appropriately.
- Verify role behavior for at least teacher and coordinator/admin paths if the task touches permissions.
- Verify direct-link behavior by loading a route in a fresh browser tab, not only through in-app navigation.
- Verify that loading/error/empty states are explicit and not blank screens.

### 8) Acceptance criteria
- All later route materialization tasks can build on common page scaffolding instead of custom layout code.
- A user moving across IB pages sees consistent breadcrumbs, action positions, and failure states.

### 9) Pitfalls and guardrails
- Do not hard-code PYP/MYP/DP labels into shared shells when they should come from route metadata or page props.
- Do not let page components read school context ad hoc in multiple places; standardize it once in the shell.

### 10) Handoff to the next task

Before moving to Task 67, update any route/contract/readiness notes introduced here so later tasks
can rely on them. If this task changes APIs or payload shapes, document the final request/response
examples in the repo (for example under `spec/` or `docs/`) rather than leaving them only in commit
history.
