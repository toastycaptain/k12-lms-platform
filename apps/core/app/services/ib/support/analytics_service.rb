module Ib
  module Support
    class AnalyticsService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        {
          teacher_friction: teacher_friction,
          coordinator_operations: coordinator_operations,
          latency_and_queue_health: latency_and_queue_health,
          pilot_success_scorecard: pilot_success_scorecard,
          generated_at: Time.current.utc.iso8601
        }
      end

      private

      attr_reader :tenant, :school

      def scoped(model)
        scope = model.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        scope
      end

      def teacher_friction
        evidence = scoped(IbEvidenceItem)
        publishing = scoped(IbPublishingQueueItem)
        {
          unvalidated_evidence: evidence.where(status: "needs_validation").count,
          linked_story_gap: evidence.where("metadata ->> 'linked_story_count' = '0'").count,
          ready_for_digest: publishing.where(state: "ready_for_digest").count
        }
      end

      def coordinator_operations
        review = Ib::Governance::ReviewGovernanceService.new(tenant: tenant, school: school).build
        {
          approvals: review[:summary_metrics][:approvals],
          moderation: review[:summary_metrics][:moderation],
          sla_breaches: review[:summary_metrics][:sla_breaches],
          orphaned: review[:summary_metrics][:orphaned]
        }
      end

      def latency_and_queue_health
        publishing = scoped(IbPublishingQueueItem)
        exports = scoped(IbStandardsExport)
        {
          publishing_held: publishing.where(state: "held").count,
          publishing_scheduled: publishing.where(state: "scheduled").count,
          export_failed: exports.where(status: "failed").count,
          export_running: exports.where(status: "running").count,
          import_blocked: scoped(IbImportBatch).where(status: %w[blocked failed]).count
        }
      end

      def pilot_success_scorecard
        readiness = Ib::Support::PilotReadinessService.new(tenant: tenant, school: school).build
        {
          overall_status: readiness[:overall_status],
          green_sections: readiness[:sections].count { |section| section[:status] == "green" },
          yellow_sections: readiness[:sections].count { |section| section[:status] == "yellow" },
          red_sections: readiness[:sections].count { |section| section[:status] == "red" }
        }
      end
    end
  end
end
