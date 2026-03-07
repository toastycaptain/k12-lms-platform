module Ib
  module Student
    class MilestoneSummaryService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id, student_id: user.id, record_family: %w[myp_project myp_service dp_ia dp_ee dp_tok dp_cas dp_core])
        scope = scope.where(school_id: school.id) if school
        scope.order(due_on: :asc, updated_at: :desc).limit(8).map do |record|
          {
            id: record.id,
            title: record.title,
            programme: record.programme,
            status: record.status,
            due_on: record.due_on,
            next_action: record.next_action,
            href: Ib::RouteBuilder.href_for(record),
            checkpoints: record.checkpoints.order(:position).map { |checkpoint| { id: checkpoint.id, title: checkpoint.title, status: checkpoint.status } }
          }
        end
      end

      private

      attr_reader :user, :school
    end
  end
end
