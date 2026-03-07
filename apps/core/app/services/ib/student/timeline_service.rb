module Ib
  module Student
    class TimelineService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        events = []
        events.concat(record_events)
        events.concat(evidence_events)
        events.concat(goal_events)
        events.sort_by { |event| event[:sort_at] || Time.at(0) }.reverse.first(20).map do |event|
          event.except(:sort_at)
        end
      end

      private

      attr_reader :user, :school

      def record_scope
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id, student_id: user.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def evidence_scope
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id, student_id: user.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def goal_scope
        Goal.where(tenant_id: user.tenant_id, student_id: user.id)
      end

      def record_events
        record_scope.limit(8).map do |record|
          {
            id: "record-#{record.id}",
            title: record.title,
            detail: record.next_action.presence || record.summary.to_s.truncate(90),
            href: Ib::RouteBuilder.href_for(record),
            kind: "milestone",
            programme: record.programme,
            sort_at: record.due_on || record.updated_at,
            status: record.risk_level
          }
        end
      end

      def evidence_events
        evidence_scope.limit(8).map do |item|
          {
            id: "evidence-#{item.id}",
            title: item.title,
            detail: item.summary.to_s.truncate(90),
            href: Ib::RouteBuilder.href_for(item),
            kind: "evidence",
            programme: item.programme,
            sort_at: item.updated_at,
            status: item.status
          }
        end
      end

      def goal_events
        goal_scope.limit(6).map do |goal|
          {
            id: "goal-#{goal.id}",
            title: goal.title,
            detail: goal.description.to_s.truncate(90),
            href: "/learn/goals",
            kind: "goal",
            programme: "Mixed",
            sort_at: goal.updated_at,
            status: goal.status
          }
        end
      end
    end
  end
end
