module Ib
  module Student
    class ReflectionService
      PROMPTS = [
        { key: "growth", title: "Growth reflection", prompt: "What changed in your thinking after feedback?" },
        { key: "agency", title: "Agency reflection", prompt: "Which choice this week had the biggest impact on your learning?" },
        { key: "transfer", title: "Transfer reflection", prompt: "Where else could you use this skill or idea?" }
      ].freeze

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        {
          prompts: PROMPTS,
          history: reflection_scope.limit(8).map do |request|
            {
              id: request.id,
              prompt: request.prompt,
              status: request.status,
              due_on: request.due_on,
              response_excerpt: request.response_excerpt,
              evidence_title: request.ib_evidence_item&.title
            }
          end
        }
      end

      private

      attr_reader :user, :school

      def reflection_scope
        scope = IbReflectionRequest.where(tenant_id: user.tenant_id, student_id: user.id).includes(:ib_evidence_item)
        if school
          scope = scope.joins(ib_evidence_item: :school).where(ib_evidence_items: { school_id: school.id })
        end
        scope.order(updated_at: :desc)
      end
    end
  end
end
