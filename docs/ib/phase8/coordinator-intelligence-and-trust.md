# IB Phase 8 Coordinator Intelligence and Trust Layer

This document closes Tasks `235` through `245`.

## Coordinator intelligence and decision support
- data and recommendation services:
  - `apps/core/app/services/ib/operations/data_mart_builder.rb`
  - `apps/core/app/services/ib/governance/queue_intelligence_service.rb`
  - `apps/core/app/services/ib/operations/recommendation_service.rb`
  - `apps/core/app/services/ib/dp/risk_model_service.rb`
  - `apps/core/app/services/ib/pyp/poi_intelligence_service.rb`
  - `apps/core/app/services/ib/myp/coverage_intelligence_service.rb`
  - `apps/core/app/services/ib/continuum/progression_service.rb`
- surfaced in:
  - `apps/web/src/features/ib/operations/ProgrammeOperationsCenter.tsx`
  - `apps/web/src/features/ib/operations/ProgrammeHealthSummary.tsx`
  - `apps/web/src/features/ib/operations/BottleneckPanel.tsx`
  - `apps/web/src/features/ib/operations/RecommendationPanel.tsx`
  - `apps/web/src/features/ib/operations/ExceptionStack.tsx`
  - `apps/web/src/features/ib/operations/ShareViewDialog.tsx`
  - `apps/web/src/features/ib/coordinator/ProgressionExplorer.tsx`
  - `apps/web/src/features/ib/pyp/PoiCoverageHeatmap.tsx`
  - `apps/web/src/features/ib/pyp/PoiOverlapPanel.tsx`
  - `apps/web/src/features/ib/myp/CoverageBalanceDashboard.tsx`
  - `apps/web/src/features/ib/dp/RiskSummaryPanel.tsx`

Phase 8 turns coordinator intelligence into jump-to-work decision support rather than a passive reporting wall.

## Guardian communication trust and calm delivery
- visibility, cadence, and interaction services:
  - `apps/core/app/services/ib/guardian/visibility_policy_service.rb`
  - `apps/core/app/services/ib/guardian/digest_strategy_service.rb`
  - `apps/core/app/services/ib/guardian/interaction_service.rb`
  - `apps/core/app/services/ib/guardian/current_unit_window_service.rb`
- communication preferences:
  - `apps/core/app/models/ib_communication_preference.rb`
  - `apps/core/app/controllers/api/v1/ib/communication_preferences_controller.rb`
  - `apps/web/src/features/ib/shared/CommunicationPreferencesPanel.tsx`
- guardian-facing surfaces:
  - `apps/web/src/features/ib/guardian/FamilyHomeV2.tsx`
  - `apps/web/src/features/ib/guardian/GuardianExperience.tsx`
  - `apps/web/src/features/ib/guardian/FamilyResponseComposer.tsx`
  - `apps/web/src/features/ib/guardian/HowToHelpPanel.tsx`
  - `apps/web/src/features/ib/guardian/GuardianPreferencesSheet.tsx`
  - `apps/web/src/features/ib/families/TranslationStatePill.tsx`
  - `apps/web/src/features/ib/families/ChannelStrategyPanel.tsx`

## Student trust, reflection confidence, and goal ownership
- student services:
  - `apps/core/app/services/ib/student/timeline_service.rb`
  - `apps/core/app/services/ib/student/reflection_service.rb`
  - `apps/core/app/services/ib/student/milestone_summary_service.rb`
  - `apps/core/app/services/ib/student/peer_feedback_service.rb`
  - `apps/core/app/services/ib/student/portfolio_search_service.rb`
- student UI:
  - `apps/web/src/features/ib/student/LearningTimeline.tsx`
  - `apps/web/src/features/ib/student/ReflectionComposer.tsx`
  - `apps/web/src/features/ib/student/ReflectionHistoryPanel.tsx`
  - `apps/web/src/features/ib/student/StudentGoalsPanel.tsx`
  - `apps/web/src/features/ib/student/StudentQuickActionsTray.tsx`
  - `apps/web/src/features/ib/student/NextActionsCard.tsx`
  - `apps/web/src/features/ib/student/PeerFeedbackPanel.tsx`
  - `apps/web/src/features/ib/student/StudentExperience.tsx`

## Validation surfaces
- coordinator browser coverage: `apps/web/e2e/ib/coordinator-intelligence.spec.ts`
- family browser coverage: `apps/web/e2e/ib/family-experience.spec.ts`
- student browser coverage: `apps/web/e2e/ib/student-experience.spec.ts`
- component coverage:
  - `apps/web/src/features/ib/guardian/GuardianExperience.test.tsx`
  - `apps/web/src/features/ib/student/StudentExperience.test.tsx`

## Exit signal for this stream
Tasks `235` through `245` are complete when:
- coordinator outputs explain why work is slipping and where to jump next;
- guardian delivery remains calm, preference-aware, and explicitly moderated;
- students see goals, reflection, and progress in one trustworthy flow.
