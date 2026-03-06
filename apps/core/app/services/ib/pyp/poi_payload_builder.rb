module Ib
  module Pyp
    class PoiPayloadBuilder
      THEMES = [
        "Who We Are",
        "Where We Are in Place and Time",
        "How We Express Ourselves",
        "How the World Works",
        "How We Organize Ourselves",
        "Sharing the Planet"
      ].freeze

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        poi = scoped_poi.order(updated_at: :desc).first
        {
          board: ActiveModelSerializers::SerializableResource.new(poi).as_json,
          themes: THEMES,
          years: poi&.entries&.map(&:year_level)&.uniq || [],
          summary_metrics: summary_metrics(poi)
        }
      end

      private

      attr_reader :user, :school

      def scoped_poi
        scope = PypProgrammeOfInquiry.includes(:entries).where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def summary_metrics(poi)
        entries = Array(poi&.entries)
        [
          metric("Mapped units", entries.length),
          metric("Specialist contributions", entries.count { |entry| entry.specialist_expectations.present? }),
          metric("Watch signals", entries.count { |entry| entry.coherence_signal == "watch" }),
          metric("Risk signals", entries.count { |entry| entry.coherence_signal == "risk" })
        ]
      end

      def metric(label, value)
        { label: label, value: value.to_s }
      end
    end
  end
end
