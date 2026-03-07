# IB Phase 8 Realtime Collaboration and Speed

This document closes Tasks `223` through `234`.

## Realtime collaboration contract
- collaboration session model and policy:
  - `apps/core/app/models/ib_collaboration_session.rb`
  - `apps/core/app/policies/ib_collaboration_session_policy.rb`
- collaboration service and controller:
  - `apps/core/app/services/ib/collaboration/session_service.rb`
  - `apps/core/app/controllers/api/v1/ib/collaboration_sessions_controller.rb`
- document comment and collaborator models:
  - `apps/core/app/models/ib_document_comment.rb`
  - `apps/core/app/models/ib_document_collaborator.rb`
- comment/collaborator APIs:
  - `apps/core/app/controllers/api/v1/ib/document_comments_controller.rb`
  - `apps/core/app/controllers/api/v1/ib/document_collaborators_controller.rb`

Phase 8 moves planning collaboration from passive shared access to active session tracking with comments, mentions, suggestions, and task-style comment types.

## Presence, conflict handling, and autosave
- editor integration: `apps/web/src/curriculum/documents/DocumentEditor.tsx`
- autosave plumbing:
  - `apps/core/app/controllers/api/v1/ib/section_autosaves_controller.rb`
  - `apps/core/app/services/curriculum/section_autosave_service.rb`
  - `apps/web/src/features/ib/shared/useSectionAutosave.ts`
  - `apps/web/src/features/ib/shared/SaveStatePill.tsx`
- offline/conflict recovery:
  - `apps/web/src/features/ib/offline/useIbMutationQueue.ts`
  - `apps/web/src/features/ib/offline/ConflictResolutionDialog.tsx`
  - `apps/web/src/features/ib/offline/offlineStore.ts`

The document editor now heartbeats collaboration sessions, shows live editor presence, and surfaces conflict-risk state instead of silently dropping concurrent edits.

## Keyboard-first and planning-speed upgrades
- command surface and shortcuts:
  - `apps/web/src/features/ib/navigation/CommandPalette.tsx`
  - `apps/web/src/features/ib/navigation/useKeyboardShortcuts.ts`
  - `apps/web/src/features/ib/navigation/keyboard-map.ts`
- batch and sequence actions:
  - `apps/web/src/features/ib/planning/BulkCarryForwardPanel.tsx`
  - `apps/web/src/features/ib/planning/DuplicateDocumentDialog.tsx`
  - `apps/web/src/features/ib/planning/SequenceBlockEditor.tsx`
  - `apps/web/src/features/ib/planning/SequenceBoard.tsx`
- specialist speed surfaces:
  - `apps/web/src/features/ib/specialist/SpecialistDashboardV2.tsx`
  - `apps/web/src/features/ib/specialist/SpecialistQueue.tsx`
  - `apps/web/src/features/ib/specialist/SpecialistLibraryPanel.tsx`
  - `apps/web/src/features/ib/specialist/SpecialistMobileCapture.tsx`

## Context persistence and benchmark telemetry
- persisted work context and resume flow:
  - `apps/web/src/features/ib/home/PinnedWorkPanel.tsx`
  - `apps/web/src/features/ib/home/ResumeCard.tsx`
  - `apps/web/src/features/ib/home/ChangedSinceLastVisit.tsx`
- benchmark and performance services:
  - `apps/core/app/services/ib/support/workflow_benchmark_service.rb`
  - `apps/core/app/services/ib/support/performance_budget_service.rb`
  - `apps/core/app/services/ib/support/activity_event_service.rb`
  - `apps/web/src/features/ib/analytics/emitIbEvent.ts`

## Validation surfaces
- browser coverage already exists for teacher speed and specialist mode:
  - `apps/web/e2e/ib/teacher-workflow-benchmark.spec.ts`
  - `apps/web/e2e/ib/performance-budgets.spec.ts`
  - `apps/web/e2e/ib/specialist-mode.spec.ts`

## Exit signal for this stream
Tasks `223` through `234` are complete when:
- live planning has session-awareness and conflict handling;
- comments and collaborator workflows are first-class API-backed actions;
- keyboard/batch/resume flows reduce planning friction instead of adding modal churn;
- benchmark telemetry can explain whether the speed work helped.
