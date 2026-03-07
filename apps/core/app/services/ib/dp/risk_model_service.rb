module Ib
  module Dp
    class RiskModelService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        scope = IbOperationalRecord.where(tenant_id: tenant.id, programme: "DP")
        scope = scope.where(school_id: school.id) if school
        scope.map do |record|
          factors = []
          factors << "overdue" if record.due_on.present? && record.due_on < Date.current
          factors << "explicit_risk" if record.risk_level == "risk"
          factors << "missing_owner" if record.owner_id.blank?
          factors << "stale_update" if record.updated_at < 10.days.ago
          {
            id: record.id,
            title: record.title,
            record_family: record.record_family,
            risk_score: [ factors.count * 25, 100 ].min,
            factors: factors,
            threshold: threshold_for(record),
            href: Ib::RouteBuilder.href_for(record)
          }
        end
      end

      private

      attr_reader :tenant, :school

      def threshold_for(record)
        setting = IbProgrammeSetting.where(tenant_id: tenant.id, school_id: school&.id, programme: record.programme).first ||
          IbProgrammeSetting.where(tenant_id: tenant.id, school_id: nil, programme: record.programme).first
        (setting&.thresholds || {}).fetch("dp_risk_threshold", 50)
      end
    end
  end
end
