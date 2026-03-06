# Task 11 — IB STEP3 TEACHER ACTION CONSOLE DATA AND ACTIVITY MODEL

## Position in sequence
- **Step:** 3 — Build the teacher operations layer
- **Run after:** Task 10
- **Run before:** Task 12 binds the teacher action console frontend to this live payload.
- **Primary mode:** Backend + Frontend

## Objective
Create the backend data and service layer for a real teacher action console: prioritized tasks, recent changes, blocked work, evidence waiting, family publishing attention, and project/core milestones needing action.

## Why this task exists now
The teacher home surface should now become an operations console, not a static dashboard. That requires a backend notion of teacher-facing priority items and recent changes. Without this, the UI will still be a façade over mock cards.

## Current repo anchors
- `apps/web/src/features/ib/home/TeacherActionConsole.tsx`
- `apps/web/src/features/ib/home/useIbHomePayload.ts`
- `apps/core/app/controllers/api/v1/ib/*` (new)
- `apps/core/app/models/curriculum_document.rb`
- `apps/core/app/models/approval.rb`
- Future evidence/story models introduced in Step 5

## Scope
- Define a teacher action model for the home console, even if it is produced by query services rather than persisted as a dedicated table.
- Model categories such as `resume_work`, `needs_review`, `needs_publish_decision`, `awaiting_reflection`, `coordinator_returned`, `specialist_request`, `project_milestone_due`, and `family_digest_attention`.
- Design ranking rules that prioritize today's work without hiding slower-moving blockers.
- Create API endpoints/services that return prioritized action cards and recent changes for the logged-in teacher.

## Backend work
- Create teacher-console query/service objects under `apps/core/app/services/ib/home/` or `queries/ib/home/`.
- Return stable JSON sections such as `priority_actions`, `recent_changes`, `resume_targets`, `queue_counts`, and `watch_items`.
- Support filters by programme, school, planning context, and owned vs contributed work.
- Use document workflow state, update timestamps, approvals, collaborator requests, and later evidence/publishing queues as inputs.

## Frontend work
- Add hook typing and lightweight adapters for the new payload, but do not yet redesign the UI in this task.
- Prepare icon/tone mapping constants and empty-state messaging that the next task will consume.

## Data contracts, APIs, and model rules
- Each action item should contain `action_type`, `title`, `detail`, `href`, `entity_ref`, `priority_score`, `status_tone`, `programme`, and `changed_since_last_seen` if applicable.
- Consider whether to persist `last_seen_at` / `acknowledged_at` for teachers so the system can highlight what changed since the last visit.
- Document how temporary missing subsystems (evidence, stories, DP core) should degrade gracefully in the payload until later tasks bring them live.

## Risks and guardrails
- Do not base priorities solely on timestamps; include workflow significance and role relevance.
- Do not return raw DB rows that force the browser to infer action semantics.

## Testing and verification
- Request specs for the teacher-console endpoint.
- Service tests that prove ranking rules prefer urgent actions over stale low-value cards.
- Verify the endpoint behaves sensibly before Step 5 exists (evidence-related cards should degrade gracefully, not crash).

## Feature flags / rollout controls
- Feature-flag with `ib_teacher_console_v1` if needed.
- Do not collapse all teacher work into a single unreadable list; grouped sections are required.

## Acceptance criteria
- There is a real backend payload for the teacher action console.
- Priority and recent-change logic are explicit and testable.
- Task 12 can now turn the existing console UI into a live operations surface.

## Handoff to the next task
- Task 12 binds the teacher action console frontend to this live payload.
