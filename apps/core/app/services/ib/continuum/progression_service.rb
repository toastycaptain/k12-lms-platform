module Ib
  module Continuum
    class ProgressionService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        docs = CurriculumDocument.where(tenant_id: tenant.id)
        docs = docs.where(school_id: school.id) if school
        grouped = docs.group_by { |document| programme_for(document) }
        grouped.transform_values do |records|
          records.first(8).map do |document|
            {
              id: document.id,
              title: document.title,
              href: Ib::RouteBuilder.href_for(document),
              document_type: document.document_type,
              updated_at: document.updated_at.iso8601
            }
          end
        end
      end

      private

      attr_reader :tenant, :school

      def programme_for(document)
        type = document.document_type.to_s
        return "PYP" if type.start_with?("ib_pyp")
        return "MYP" if type.start_with?("ib_myp")
        return "DP" if type.start_with?("ib_dp")

        "Mixed"
      end
    end
  end
end
