# Task 01 — IB STEP1 ROUTE AUDIT AND CANONICAL OBJECT MODEL

## Position in sequence
- **Step:** 1 — Bind the IB UI to live document flows
- **Run after:** 00_IB_PHASE3_MASTER_EXECUTION.md
- **Run before:** Task 02 depends on this matrix to generate real route files and redirects.
- **Primary mode:** Backend + Frontend

## Objective
Create a complete route-and-object inventory for the IB experience so every screen, card, badge, queue item, and breadcrumb points to a real canonical entity and route. This task must remove ambiguity between “IB presentation routes” and “generic curriculum document routes” before any implementation cutover begins.

## Why this task exists now
The codebase already contains a strong route registry and top-level IB workspaces, but the registry still masks mismatch between registered routes, real `app/ib` route files, and the actual canonical backend entity for each surface. Until there is a written object model and route matrix, subsequent Codex tasks can drift or create duplicate paths.

## Current repo anchors
- `apps/web/src/features/ib/core/route-registry.ts`
- `apps/web/src/features/ib/shell/getIbWorkspaceConfig.ts`
- `apps/web/src/app/ib/*`
- `apps/web/src/features/ib/home/IbDashboardPage.tsx`
- `apps/web/src/features/ib/coordinator/CollaborationHub.tsx`
- `apps/web/src/features/ib/student/StudentLearningStream.tsx`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/planning_context.rb`
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json`

## Scope
- Audit every `IbRouteId` and every linked href emitted by IB pages/components.
- Produce a canonical object map that identifies the primary backend entity for each route: `planning_context`, `curriculum_document`, `curriculum_document_version`, evidence item, learning story, POI record, exhibition record, MYP project, DP core object, standards/practices packet, etc.
- Document which surfaces should resolve by numeric database ID vs slug vs composite context (`school + academic_year + planning_context + document`).
- Identify where current routes should remain “workspace summaries” and where they must become “record detail” routes.
- Write the audit result into the repo under `spec/ib-phase3-codex-tasks/support/route-object-matrix.md` or equivalent support file that later tasks can reference.

## Backend work
- Add any missing lightweight serializers/fields needed to support canonical object identity on the frontend (for example, stable slugs, programme tags, or planning-context metadata).
- Decide which objects need dedicated API namespaces under `/api/v1/ib/*` and which can stay under existing generic `curriculum_documents` or `planning_contexts` endpoints.
- Document any backend gaps discovered during the audit; do not implement large new models in this task beyond small metadata additions required to complete the inventory.

## Frontend work
- Refactor route helpers so the canonical route model becomes the only source of truth for route generation.
- Add tests that compare route-registry entries against actual Next.js route files and fail when the registry points to a non-existent page or dead alias.
- Replace any route helper usage that still depends on demo IDs or hardcoded showcase examples.

## Data contracts, APIs, and model rules
- Define a route-object matrix with columns for `route_id`, `canonical_href_pattern`, `workspace`, `programme`, `entity_type`, `entity_lookup_strategy`, `required_permissions`, `old_aliases`, and `needs_redirect`.
- Define URL naming conventions for PYP, MYP, DP, and mixed surfaces: e.g. `/ib/pyp/units/[documentId]`, `/ib/myp/units/[documentId]`, `/ib/dp/course-maps/[documentId]`, `/ib/pyp/poi/[poiId]`.
- Specify route resolution rules for mixed surfaces such as home, operations, review, standards/practices, and family publishing.
- Identify any places where the frontend should load by querystring/context rather than route param and justify why.

## Risks and guardrails
- Do not silently repurpose an old route to a different entity type without creating a redirect and documenting the migration.
- Do not let PYP/MYP/DP detail routes collapse into one generic `/ib/documents/[id]` path. Programme-specific URL clarity matters.
- Do not overfit the route system to one pack version; the route-object model should survive future pack expansion.

## Explicitly out of scope
- Implementing evidence/story/POI/DP models in depth. This task only defines the canonical route and object map.
- Building new UI surfaces. Existing surfaces may be lightly adjusted only if needed to complete the audit.

## Testing and verification
- Add route-registry unit tests and route-existence smoke tests.
- Add a generated or checked-in route matrix file so reviewers can compare before/after route coverage.
- Verify that the route-object matrix covers student and guardian views, not just teacher/coordinator views.

## Feature flags / rollout controls
- Gate any route aliases that change user-visible URLs behind `ib_live_routes_v1` if redirects are needed.
- Do not remove old aliases in this task; mark them for redirect and deprecation in later tasks.

## Acceptance criteria
- Every IB route and deep link is associated with a real canonical entity or a workspace summary role.
- There is a checked-in matrix mapping existing and target routes.
- There are no unresolved or undocumented `demo` object assumptions left in the route system.
- The next task can create real route files without guessing IDs, entities, or ownership rules.

## Handoff to the next task
- Task 02 depends on this matrix to generate real route files and redirects.
