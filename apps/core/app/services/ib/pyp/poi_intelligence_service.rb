module Ib
  module Pyp
    class PoiIntelligenceService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        scope = PypProgrammeOfInquiryEntry.joins(:pyp_programme_of_inquiry).where(tenant_id: tenant.id)
        scope = scope.where(pyp_programme_of_inquiries: { school_id: school.id }) if school
        entries = scope.to_a
        {
          coverage_heatmap: entries.group_by(&:year_level).transform_values { |rows| rows.group_by(&:theme).transform_values(&:count) },
          overlap_rows: entries.select { |entry| entry.coherence_signal.in?(%w[watch risk]) }.map do |entry|
            {
              id: entry.id,
              title: entry.title,
              year_level: entry.year_level,
              theme: entry.theme,
              signal: entry.coherence_signal,
              href: "/ib/pyp/poi##{entry.id}"
            }
          end
        }
      end

      private

      attr_reader :tenant, :school
    end
  end
end
