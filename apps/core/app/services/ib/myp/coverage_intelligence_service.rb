module Ib
  module Myp
    class CoverageIntelligenceService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        scope = CurriculumDocument.where(tenant_id: tenant.id, document_type: %w[ib_myp_unit ib_myp_interdisciplinary_unit])
        scope = scope.where(school_id: school.id) if school
        {
          concept_balance: aggregate(scope, "key_concepts"),
          context_balance: aggregate(scope, "global_contexts"),
          atl_balance: aggregate(scope, "atl_focus"),
          criteria_balance: aggregate(scope, "assessment_criteria")
        }
      end

      private

      attr_reader :tenant, :school

      def aggregate(scope, key)
        scope.each_with_object(Hash.new(0)) do |document, memo|
          values = Array(document.current_version&.content&.[](key))
          values = [ document.current_version&.content&.dig(key) ] if values.blank? && document.current_version&.content&.dig(key).present?
          values.compact.each { |value| memo[value.to_s] += 1 }
        end.sort_by { |_value, count| -count }.to_h
      end
    end
  end
end
