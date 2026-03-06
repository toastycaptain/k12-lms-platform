# Task 14 — IB STEP3 COLLABORATION COMMENTS REVIEW NOTES AND PRESENCE

## Position in sequence
- **Step:** 3 — Build the teacher operations layer
- **Run after:** Task 13
- **Run before:** Task 15 extends collaboration into specialist-first workflows and shared ownership patterns.
- **Primary mode:** Backend + Frontend

## Objective
Add real collaboration primitives to live IB documents: field comments, general review notes, collaborator assignments, and presence/session awareness where feasible.

## Why this task exists now
The UI already gestures toward collaborative planning. To surpass competitor pain points, collaboration must be embedded in the work surface itself rather than split into separate chat spaces or left as static comments.

## Current repo anchors
- `apps/web/src/features/ib/pyp/PypUnitStudio.tsx`
- `apps/web/src/features/ib/myp/MypUnitStudio.tsx`
- `apps/web/src/features/ib/dp/DpWorkspaces.tsx`
- `apps/web/src/features/ib/coordinator/CollaborationHub.tsx`
- `apps/core/app/models` (new collaboration models)
- `apps/core/app/controllers/api/v1/ib/*` (new comment/collaboration endpoints)

## Scope
- Design and implement collaboration models for document-level comments, field-anchored comments, review notes, collaborator roles, and optional soft presence.
- Allow coordinators and specialists to leave targeted comments inside the studio without forcing teachers into separate workspaces.
- Support shared ownership and contribution modes that later tasks will extend for specialists.

## Backend work
- Create models such as `CurriculumDocumentComment`, `CurriculumDocumentFieldComment`, `CurriculumDocumentCollaborator`, or equivalent.
- Add controllers/endpoints for list/create/update/resolve comments and collaborator assignments.
- Model comment status (open, resolved, reopened), author, anchor path/field id, visibility, and timestamps.
- Consider presence/session awareness as a lightweight capability (e.g. Redis-backed or heartbeat-based summary) only if feasible; if not, implement last-active summaries instead of fake realtime presence.

## Frontend work
- Replace static comment threads and presence chips with live hooks.
- Expose comments in a side rail or contextual drawer tied to studio fields.
- Support inline comment indicators, unresolved counts, and quick-resolve actions.
- Integrate collaborator summaries into the studio header/context rail.

## Data contracts, APIs, and model rules
- Anchor field comments using stable schema field IDs or content paths.
- Keep collaboration metadata separate from `content` JSONB; comments should not mutate the document payload itself.
- Document visibility rules (teacher/coordinator/specialist only vs family-visible notes are never mixed here).

## Risks and guardrails
- Do not store comments inside the document JSON content.
- Do not mix internal review notes with any family-visible content subsystem.

## Testing and verification
- Model tests for comments and collaborators.
- Request specs for comment and collaborator endpoints.
- Frontend tests for rendering unresolved comment badges and field-level note markers.

## Feature flags / rollout controls
- Feature-flag with `ib_document_collaboration_v1` if collaboration rollout needs isolation.
- Do not fake realtime presence if the infrastructure is not ready; prefer honest last-activity summaries over misleading live indicators.

## Acceptance criteria
- Studios support real planning collaboration and review notes.
- Comments are anchored, auditable, and role-scoped.
- Task 15 can now build specialist mode on top of shared ownership rather than hacks.

## Handoff to the next task
- Task 15 extends collaboration into specialist-first workflows and shared ownership patterns.
