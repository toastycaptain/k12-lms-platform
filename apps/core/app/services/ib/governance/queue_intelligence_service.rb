module Ib
  module Governance
    class QueueIntelligenceService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        records = scoped(IbOperationalRecord)
        documents = scoped(CurriculumDocument)
        {
          stuck_reasons: {
            pending_review: documents.where(status: "pending_approval").count,
            specialist_waiting: records.where(record_family: "specialist", status: "awaiting_response").count,
            overdue_milestones: records.where("due_on < ?", Date.current).where.not(status: %w[completed published]).count
          },
          sla_rows: sla_rows(records, documents)
        }
      end

      private

      attr_reader :tenant, :school

      def scoped(model)
        scope = model.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        scope
      end

      def sla_rows(records, documents)
        [
          { key: "approvals", label: "Approvals", at_risk: documents.where(status: "pending_approval").count, threshold_days: 5 },
          { key: "specialist", label: "Specialist handoffs", at_risk: records.where(record_family: "specialist", status: "awaiting_response").count, threshold_days: 3 },
          { key: "core", label: "Core milestones", at_risk: records.where(programme: "DP", risk_level: "risk").count, threshold_days: 7 }
        ]
      end
    end
  end
end
