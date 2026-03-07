module Ib
  module Operations
    class DataMartBuilder
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        {
          documents: document_metrics,
          evidence: evidence_metrics,
          publishing: publishing_metrics,
          specialist: specialist_metrics,
          programmes: programme_breakdown,
          updated_at: Time.current.utc.iso8601
        }
      end

      private

      attr_reader :tenant, :school

      def documents_scope
        scope = CurriculumDocument.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def evidence_scope
        scope = IbEvidenceItem.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def story_scope
        scope = IbLearningStory.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def record_scope
        scope = IbOperationalRecord.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def packet_scope
        scope = IbStandardsPacket.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def document_metrics
        {
          total: documents_scope.count,
          pending_approval: documents_scope.where(status: "pending_approval").count,
          by_type: documents_scope.group(:document_type).count
        }
      end

      def evidence_metrics
        {
          total: evidence_scope.count,
          needs_validation: evidence_scope.where(status: "needs_validation").count,
          reflection_requested: evidence_scope.where(status: "reflection_requested").count
        }
      end

      def publishing_metrics
        queue_scope = IbPublishingQueueItem.where(tenant_id: tenant.id)
        queue_scope = queue_scope.where(school_id: school.id) if school
        {
          queued: story_scope.where.not(state: "published").count,
          held: queue_scope.where(state: "held").count,
          published: story_scope.where(state: "published").count
        }
      end

      def specialist_metrics
        SpecialistMetricsService.new(tenant: tenant, school: school).build
      end

      def programme_breakdown
        record_scope.group(:programme).count.merge(packet_scope.group(:review_state).count.transform_keys { |key| "packet_#{key}" })
      end
    end
  end
end
