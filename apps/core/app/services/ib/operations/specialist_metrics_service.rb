module Ib
  module Operations
    class SpecialistMetricsService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        scope = IbDocumentCollaborator.active.where(tenant_id: tenant.id, role: "specialist_contributor")
        scope = scope.joins(:curriculum_document).where(curriculum_documents: { school_id: school.id }) if school
        counts = scope.group(:user_id).count
        {
          active_specialists: counts.keys.count,
          overloaded_specialists: counts.count { |_user_id, count| count >= 7 },
          unassigned_units: unassigned_units(scope),
          average_assignments: counts.values.sum / [ counts.values.count, 1 ].max.to_f
        }
      end

      private

      attr_reader :tenant, :school

      def unassigned_units(scope)
        docs = CurriculumDocument.where(tenant_id: tenant.id, document_type: %w[ib_pyp_unit ib_myp_unit ib_dp_course_map])
        docs = docs.where(school_id: school.id) if school
        docs.count do |document|
          !scope.where(curriculum_document_id: document.id).exists?
        end
      end
    end
  end
end
