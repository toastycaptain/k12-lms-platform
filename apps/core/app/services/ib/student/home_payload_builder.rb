module Ib
  module Student
    class HomePayloadBuilder
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        evidence = scoped_evidence
        records = scoped_records
        {
          next_checkpoints: records.first(5).map { |record| serialize_record(record) },
          reflections_due: evidence.joins(:reflection_requests).merge(IbReflectionRequest.where(status: "requested")).limit(5).map { |item| serialize_evidence(item) },
          validated_evidence: evidence.where(status: "validated").limit(5).map { |item| serialize_evidence(item) },
          project_milestones: records.where(record_family: %w[myp_project myp_service dp_core dp_ia dp_ee dp_tok dp_cas]).limit(5).map { |record| serialize_record(record) }
        }
      end

      private

      attr_reader :user, :school

      def scoped_evidence
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(student_id: user.id) if user.has_role?(:student)
        scope.order(updated_at: :desc)
      end

      def scoped_records
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(student_id: user.id) if user.has_role?(:student)
        scope.order(due_on: :asc, updated_at: :desc)
      end

      def serialize_record(record)
        {
          id: record.id,
          programme: record.programme,
          record_family: record.record_family,
          title: record.title,
          summary: record.summary,
          next_action: record.next_action,
          due_on: record.due_on,
          risk_level: record.risk_level,
          href: Ib::RouteBuilder.href_for(record)
        }
      end

      def serialize_evidence(item)
        {
          id: item.id,
          title: item.title,
          summary: item.summary,
          status: item.status,
          visibility: item.visibility
        }
      end
    end
  end
end
