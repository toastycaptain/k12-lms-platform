module Ib
  module Student
    class PeerFeedbackService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        younger_context = user.respond_to?(:grade_level) && user.grade_level.to_i <= 5
        {
          enabled: !younger_context,
          moderation_required: true,
          guidelines: [
            "Be specific about the evidence you noticed.",
            "Describe one strength and one next step.",
            "Keep tone respectful and actionable."
          ],
          recent_feedback: recent_feedback
        }
      end

      private

      attr_reader :user, :school

      def recent_feedback
        scope = IbActivityEvent.where(tenant_id: user.tenant_id, user_id: user.id, event_name: "ib.student.peer_feedback.shared")
        scope = scope.where(school_id: school.id) if school
        scope.recent.limit(5).map do |event|
          {
            id: event.id,
            title: event.metadata["title"].presence || "Peer feedback shared",
            detail: event.metadata["detail"].presence || "Structured peer feedback recorded."
          }
        end
      end
    end
  end
end
