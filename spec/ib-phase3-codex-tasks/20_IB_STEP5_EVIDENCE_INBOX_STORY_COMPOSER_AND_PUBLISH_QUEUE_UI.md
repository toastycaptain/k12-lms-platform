# Task 20 — IB STEP5 EVIDENCE INBOX STORY COMPOSER AND PUBLISH QUEUE UI

## Position in sequence
- **Step:** 5 — Turn portfolio / family publishing into a real subsystem
- **Run after:** Task 19
- **Run before:** Task 21 adds scheduling, digest delivery rules, and calm-mode guardian consumption.
- **Primary mode:** Backend + Frontend

## Objective
Bind the IB evidence inbox, story composer, and publishing queue to live backend data so teachers can triage evidence, request reflections, assemble stories, and manage family publishing from real queues.

## Why this task exists now
The UI direction is already good. This task makes it operational and explicitly lower-friction than competitor experiences by turning evidence and publishing into one coherent flow rather than several disconnected surfaces.

## Current repo anchors
- Output from Task 19
- `apps/web/src/features/ib/evidence/EvidenceInbox.tsx`
- `apps/web/src/features/ib/evidence/EvidenceReviewDrawer.tsx`
- `apps/web/src/features/ib/evidence/EvidenceToStoryComposer.tsx`
- `apps/web/src/features/ib/family/LearningStoryComposer.tsx`
- `apps/web/src/features/ib/families/PublishingQueue.tsx`
- `apps/web/src/features/ib/families/FamilyPreviewPanel.tsx`

## Scope
- Replace mock evidence, stories, and publishing queues with live hooks.
- Implement bulk triage actions, request reflection, visibility decisions, attach-to-story flows, story draft creation, and publish-queue actions.
- Make the journey from “evidence captured” to “family-ready narrative” feel unified and intentionally calmer than systems that over-post or bury visibility decisions.

## Backend work
- Add any missing backend endpoints for bulk actions, queue transitions, preview generation, or reflection-request actions.
- Support server-side validation of visibility and publish-state transitions.

## Frontend work
- Bind the inbox, drawer, story composer, preview panel, and publishing queue to live endpoints.
- Add optimistic updates where safe, but preserve server truth for publish state and visibility.
- Provide batch actions for validate, request reflection, set visibility, add to story, and hold back.
- Ensure every queue row shows why it is blocked or publish-ready.

## Data contracts, APIs, and model rules
- UI state should reflect backend workflow states exactly; do not create front-end-only pseudo-status labels unless mapped directly.
- Preview surfaces should show the exact family-visible content, not the teacher-only draft state.

## Risks and guardrails
- Do not make teachers visit four separate screens to complete one publish decision if the operation can be done from the inbox/queue.
- Do not let optimistic UI mask failed publish-state transitions.

## Testing and verification
- Component and integration tests for evidence triage, story composition, and publish-queue transitions.
- Ensure no `INITIAL_EVIDENCE` / `INITIAL_STORIES` or similar placeholders remain in the IB surfaces after cutover.
- Test high-volume inbox rendering and bulk action performance.

## Feature flags / rollout controls
- Gate with `ib_evidence_subsystem_v1` and `ib_family_publishing_v1` until stable.
- Do not enable batch publish unless audit logging is proven correct.

## Acceptance criteria
- Teachers can move from evidence triage to family publishing on live data.
- The product now has a real evidence-to-story flow rather than separate mock surfaces.

## Handoff to the next task
- Task 21 adds scheduling, digest delivery rules, and calm-mode guardian consumption.
