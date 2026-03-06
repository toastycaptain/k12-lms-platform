# Task 21 — IB STEP5 FAMILY DIGEST SCHEDULER VISIBILITY AUDIT AND CALM MODE

## Position in sequence
- **Step:** 5 — Turn portfolio / family publishing into a real subsystem
- **Run after:** Task 20
- **Run before:** Task 22 begins turning POI and exhibition into first-class systems that can feed the evidence and family subsystems later.
- **Primary mode:** Backend + Frontend

## Objective
Add scheduling, digest preview/delivery logic, visibility auditing, and calm-mode guardian feed behaviour so family communication remains deliberate and non-noisy.

## Why this task exists now
A strong family experience is not just “more posts.” It needs cadence, visibility governance, and calm-mode presentation. This task operationalizes those controls and ties them to guardian consumption.

## Current repo anchors
- Output from Tasks 19–20
- `apps/web/src/features/ib/families/DigestScheduler.tsx`
- `apps/web/src/features/ib/families/PublishingQueue.tsx`
- `apps/web/src/features/ib/guardian/*`
- `apps/core/app/models` (digest/audit additions)
- `apps/core/app/controllers/api/v1/ib/*`

## Scope
- Implement digest schedules, publish windows, preview generation, delivery logging, and visibility audit trails.
- Support guardian-facing calm mode where the feed emphasizes meaningful highlights rather than every operational micro-update.
- Allow schools/programmes to prefer immediate publish, digest-only, or mixed cadence as configured later by coordinators/admins.

## Backend work
- Add backend models/endpoints for digest schedules, digest previews, delivery logs, and visibility audits if not covered in Task 19.
- Implement rules for which stories or family windows can enter a digest and how overrides/holds are recorded.
- Expose guardian feed endpoints that only return published/visible items and that respect calm-mode ordering rules.

## Frontend work
- Bind `DigestScheduler`, queue views, and guardian feed surfaces to live data.
- Show schedule status, held-back items, and preview content clearly to teachers/coordinators.
- Refine guardian views to consume real published stories, current-unit windows, and portfolio highlights from the new subsystem.

## Data contracts, APIs, and model rules
- Document digest state transitions and audit fields.
- Ensure guardian-visible endpoints never leak internal statuses or unpublished content.

## Risks and guardrails
- Do not equate more family content with better family experience; cadence and clarity matter.
- Do not allow unpublished/internal story drafts to appear in guardian APIs via query mistakes.

## Testing and verification
- Request specs for digest preview, scheduling, and guardian feed endpoints.
- UI tests for digest scheduler and guardian feed filtering.
- Audit tests verifying that held-back or internal-only items never appear in guardian responses.

## Feature flags / rollout controls
- Gate with `ib_family_publishing_v1` and, if needed, `ib_guardian_calm_mode_v1`.
- Do not send or simulate real outbound notifications if notification infrastructure is not ready; focus on queueing and preview correctness first.

## Acceptance criteria
- Family publishing is now a real governed subsystem, not a mock feed.
- Guardian calm-mode views can consume trustworthy published content.

## Handoff to the next task
- Task 22 begins turning POI and exhibition into first-class systems that can feed the evidence and family subsystems later.
