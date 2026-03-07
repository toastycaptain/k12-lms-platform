module Ib
  module Operations
    class RecommendationService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        queue = Ib::Governance::QueueIntelligenceService.new(tenant: tenant, school: school).build
        recommendations = []
        if queue[:stuck_reasons][:pending_review].positive?
          recommendations << recommendation("review_backlog", "Shift one coordinator block to approvals today.", "#{queue[:stuck_reasons][:pending_review]} approvals are still pending.", "/ib/review")
        end
        if queue[:stuck_reasons][:specialist_waiting].positive?
          recommendations << recommendation("specialist_handoff", "Nudge open specialist handoffs before the next timetable window.", "#{queue[:stuck_reasons][:specialist_waiting]} specialist items are waiting.", "/ib/specialist")
        end
        if queue[:stuck_reasons][:overdue_milestones].positive?
          recommendations << recommendation("milestone_risk", "Escalate overdue milestones with advisors.", "#{queue[:stuck_reasons][:overdue_milestones]} milestone(s) are overdue.", "/ib/operations")
        end
        recommendations
      end

      private

      attr_reader :tenant, :school

      def recommendation(key, title, detail, href)
        {
          id: key,
          title: title,
          detail: detail,
          href: href,
          dismissible: true,
          impact_metric: "queue_backlog"
        }
      end
    end
  end
end
