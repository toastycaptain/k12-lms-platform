# Task 03 — IB STEP1 WORKSPACE LANDING QUERIES AND SUMMARY ENDPOINTS

## Position in sequence
- **Step:** 1 — Bind the IB UI to live document flows
- **Run after:** Task 02
- **Run before:** Task 04 will use these live summaries to eradicate demo links and bind all navigation to real routes.
- **Primary mode:** Backend + Frontend

## Objective
Create backend query services and API endpoints for the major IB workspace landing pages so those pages can stop loading from mock arrays and stop stitching together multiple generic endpoints in the browser.

## Why this task exists now
The current IB workspace pages often present curated cards, metrics, or timelines that are still mock-driven. The product will continue to feel like a prototype until those workspaces resolve from live query objects purpose-built for the screen.

## Current repo anchors
- `apps/web/src/features/ib/home/useIbHomePayload.ts`
- `apps/web/src/features/ib/operations/ProgrammeOperationsCenter.tsx`
- `apps/web/src/features/ib/reports/ExceptionReportShell.tsx`
- `apps/web/src/features/ib/review/ReviewQueue.tsx`
- `apps/core/app/controllers/api/v1/*`
- `apps/core/config/routes.rb`
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/planning_context.rb`

## Scope
- Define landing query endpoints for at least: IB home, planning summary, operations center, review queue, evidence summary, family publishing summary, reports/exceptions, and standards/practices summary.
- Implement query objects/services rather than embedding complex SQL in controllers.
- Return already-shaped payloads for the UI, including counts, cards, route targets, role-appropriate calls to action, and last-updated metadata.
- Use school, academic year, programme, role, and workflow state filters consistently.

## Backend work
- Create new controllers and serializers under `apps/core/app/controllers/api/v1/ib/` (for example `workspaces_controller.rb`, `home_controller.rb`, `operations_controller.rb`, or equivalent).
- Create corresponding service/query objects under `apps/core/app/queries/ib/` or `apps/core/app/services/ib/`.
- Ensure payloads are policy-scoped and school-scoped.
- Add enough aggregation to support queue health, approvals waiting, evidence backlog, family cadence, missing specialist contributions, IA risk, etc., even if some counts are temporarily zero until later models exist.

## Frontend work
- Replace current mock hooks with SWR hooks that call the new endpoints.
- Preserve current visual design where possible, but make every metric card, activity item, and action CTA derive from the live payload.
- Standardize loading, empty, and degraded states for workspace pages.

## Data contracts, APIs, and model rules
- Design JSON payloads intentionally. Example structures should include `summary_metrics`, `priority_cards`, `recent_activity`, `queues`, `alerts`, and `deep_links`.
- Each payload must include timestamps and a `generated_at` value so staleness is visible.
- Each card should already contain a canonical route and entity reference so the frontend does not recreate routing logic ad hoc.

## Risks and guardrails
- Do not over-normalize landing payloads into a generic unreadable format; the payload should serve the screen.
- Do not make the UI wait on too many separate requests per workspace.
- Do not return huge embedded datasets when the page only needs summarized data and route targets.

## Testing and verification
- Add request specs for each workspace endpoint.
- Add frontend integration tests that verify mock data files are no longer imported by the relevant pages/hooks.
- Test at least one teacher, one coordinator, and one district-admin role variant if the endpoint is role-dependent.

## Feature flags / rollout controls
- New endpoints can sit behind `ib_live_routes_v1` or dedicated workspace flags such as `ib_home_live_v1` if rollout needs to be staged.
- Do not ship a live endpoint without replacing the corresponding mock import; eliminate split-brain payload sources.

## Acceptance criteria
- IB workspace landing pages load from live backend summaries.
- `apps/web/src/features/ib/shared/mock-data.ts` is no longer the source of truth for core workspace content.
- Cards and timelines already know where they deep-link, which reduces future frontend logic.

## Handoff to the next task
- Task 04 will use these live summaries to eradicate demo links and bind all navigation to real routes.
