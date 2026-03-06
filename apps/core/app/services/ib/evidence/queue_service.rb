module Ib
  module Evidence
    class QueueService
      def initialize(user:, school: nil, programme: nil)
        @user = user
        @school = school
        @programme = programme
      end

      def items
        scope = IbEvidenceItem.includes(:reflection_requests).where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(programme: programme) if programme.present?
        scope.order(updated_at: :desc)
      end

      private

      attr_reader :user, :school, :programme
    end
  end
end
