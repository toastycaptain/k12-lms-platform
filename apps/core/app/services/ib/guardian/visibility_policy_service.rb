module Ib
  module Guardian
    class VisibilityPolicyService
      STORY_STATES = %w[scheduled published].freeze
      EVIDENCE_VISIBILITY = %w[guardian_visible family_ready].freeze

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        {
          story_states: STORY_STATES,
          evidence_visibility: EVIDENCE_VISIBILITY,
          noise_budget: {
            routine_digest_per_week: 2,
            urgent_items_per_day: 1
          },
          moderation_policy: {
            comments_default: "acknowledge_only",
            teacher_can_enable_comments: true,
            translation_requires_review: true
          }
        }
      end

      private

      attr_reader :user, :school
    end
  end
end
