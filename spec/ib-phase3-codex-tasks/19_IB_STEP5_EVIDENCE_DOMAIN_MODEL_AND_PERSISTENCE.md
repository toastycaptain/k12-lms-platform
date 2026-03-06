# Task 19 — IB STEP5 EVIDENCE DOMAIN MODEL AND PERSISTENCE

## Position in sequence
- **Step:** 5 — Turn portfolio / family publishing into a real subsystem
- **Run after:** Task 18
- **Run before:** Task 20 turns the evidence inbox, story composer, and publishing queue into live frontend surfaces.
- **Primary mode:** Backend + Frontend

## Objective
Build the backend evidence and learning-story domain: evidence items, attachments, tags, reflection requests, learning stories, story-evidence links, publish queue state, visibility rules, and audit trails.

## Why this task exists now
The evidence/family experience is one of the biggest differentiators on the IB side, and it is currently one of the biggest full-stack gaps. Frontend polish is no longer enough; the data model must exist.

## Current repo anchors
- `apps/web/src/features/ib/evidence/*`
- `apps/web/src/features/ib/families/*`
- `apps/web/src/features/ib/family/LearningStoryComposer.tsx`
- `apps/web/src/features/ib/guardian/*`
- `apps/core/app/models` (new evidence/story models)
- `apps/core/app/controllers/api/v1/ib/*`

## Scope
- Design and implement real models for evidence capture, comments/validation, reflection requests, learning stories, story composition, audience visibility, publish queue states, and audit logging.
- Keep internal planning/evidence state separate from family-facing published narrative state.
- Use strong relationships to curriculum documents, planning contexts, students, staff, and eventually standards/practices packets.

## Backend work
- Create models such as `EvidenceItem`, `EvidenceAttachment`, `EvidenceLink`, `EvidenceComment` or reuse naming already present in the product if more suitable.
- Create `ReflectionRequest`, `LearningStory`, `LearningStoryBlock` or similar block-based composition, `LearningStoryEvidenceItem`, `FamilyPublishJob`/`FamilyPublishQueueItem`, `AudienceVisibilityRule`, and any required join tables.
- Use ActiveStorage or the project’s chosen attachment system for media/files.
- Add controller endpoints for CRUD, queue transitions, story linking/unlinking, validation state, and visibility settings.
- Add audit log entries for publish-state changes and visibility changes.

## Frontend work
- Add new frontend types/hooks only as much as needed to prepare for Task 20.
- Do not fully redesign UI in this task; focus on the persistence substrate and contract shape.

## Data contracts, APIs, and model rules
- Evidence items should support links to `CurriculumDocument`, `CurriculumDocumentVersion`, students, guardians (visibility only), and planning context.
- Story composition should support multiple evidence items and freeform narrative blocks without turning the entire story into one opaque blob if block-level editing is useful.
- Visibility rules must distinguish internal-only, student-visible, guardian-visible, and digest-scheduled content.
- Publish queue states should be explicit (`draft`, `ready_for_review`, `ready_for_digest`, `published`, `held_back`, etc.).

## Risks and guardrails
- Do not mix family-visible narrative content into the same fields used for internal staff deliberation.
- Do not model evidence as just another document type if attachment-heavy workflows and validation states need their own subsystem semantics.

## Testing and verification
- Model tests for evidence items, stories, visibility rules, and queue transitions.
- Request specs for core evidence/story endpoints.
- Storage tests for attachment handling and authorization.

## Feature flags / rollout controls
- Flag with `ib_evidence_subsystem_v1` and `ib_family_publishing_v1`.
- Do not attempt auto-publishing in this task.

## Acceptance criteria
- The IB evidence and family publishing subsystem exists as a real backend capability.
- Task 20 can now bind the existing evidence/story/publishing UI to live data.

## Handoff to the next task
- Task 20 turns the evidence inbox, story composer, and publishing queue into live frontend surfaces.
