module Ib
  module Intelligence
    class SemanticLayerService
      DEFAULT_DEFINITIONS = [
        { key: "programme_health", metric_family: "programme_health", label: "Programme health", definition: "Exception-weighted health score." },
        { key: "risk_watch", metric_family: "risk", label: "Risk watch", definition: "Count of records or queues entering watch/risk state." },
        { key: "throughput", metric_family: "workflow", label: "Workflow throughput", definition: "Approval and review movement across a school week." },
        { key: "staffing_load", metric_family: "staffing", label: "Staffing load", definition: "Assigned work per specialist/coordinator cohort." },
        { key: "family_engagement", metric_family: "engagement", label: "Family engagement", definition: "Read and acknowledgement coverage for released communications." }
      ].freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        ensure_defaults!
        {
          generated_at: Time.current.utc.iso8601,
          metric_dictionary: definition_scope.order(:metric_family, :key).map { |definition| serialize_definition(definition) },
          summary: summary_payload,
          source_map: source_map
        }
      end

      def upsert_definition!(attrs)
        definition = attrs[:id].present? ? definition_scope.find(attrs[:id]) : definition_scope.find_or_initialize_by(key: attrs[:key], version: attrs[:version].presence || "phase9.v1")
        definition.assign_attributes(
          school: school,
          created_by: actor || definition.created_by,
          key: attrs[:key].presence || definition.key,
          status: attrs[:status].presence || definition.status || "draft",
          metric_family: attrs[:metric_family].presence || definition.metric_family || "programme_health",
          label: attrs[:label].presence || definition.label,
          definition: attrs[:definition].presence || definition.definition,
          version: attrs[:version].presence || definition.version || "phase9.v1",
          source_of_truth: definition.source_of_truth.merge(normalize_hash(attrs[:source_of_truth])),
          threshold_config: definition.threshold_config.merge(normalize_hash(attrs[:threshold_config])),
          metadata: definition.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        definition.save!
        serialize_definition(definition)
      end

      private

      attr_reader :tenant, :school, :actor

      def definition_scope
        scope = IbIntelligenceMetricDefinition.where(tenant_id: tenant.id)
        scope = scope.where(school_id: [ school&.id, nil ].compact) if school
        scope
      end

      def ensure_defaults!
        return if definition_scope.exists?

        DEFAULT_DEFINITIONS.each do |row|
          definition_scope.create!(
            school: school,
            created_by: actor,
            key: row[:key],
            status: "active",
            metric_family: row[:metric_family],
            label: row[:label],
            definition: row[:definition],
            version: "phase9.v1",
            source_of_truth: { "service" => row[:key] },
            threshold_config: { "watch" => 1, "risk" => 3 },
            metadata: {}
          )
        end
      end

      def summary_payload
        queue_intelligence = ::Ib::Governance::QueueIntelligenceService.new(tenant: tenant, school: school).build rescue {}
        recommendation = ::Ib::Operations::RecommendationService.new(tenant: tenant, school: school).build rescue []
        {
          programme_health: queue_intelligence[:queues] || {},
          recommendation_count: Array(recommendation).length,
          reporting_cycles: count_for(IbReportCycle),
          migration_sessions: count_for(IbMigrationSession),
          trust_policies: count_for(IbTrustPolicy)
        }
      end

      def source_map
        {
          programme_health: "Ib::Governance::QueueIntelligenceService",
          recommendation_count: "Ib::Operations::RecommendationService",
          reporting_cycles: "IbReportCycle",
          migration_sessions: "IbMigrationSession",
          trust_policies: "IbTrustPolicy"
        }
      end

      def serialize_definition(definition)
        {
          id: definition.id,
          key: definition.key,
          status: definition.status,
          metric_family: definition.metric_family,
          label: definition.label,
          definition: definition.definition,
          version: definition.version,
          source_of_truth: definition.source_of_truth,
          threshold_config: definition.threshold_config,
          updated_at: definition.updated_at.utc.iso8601
        }
      end

      def count_for(model)
        scope = model.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        scope.count
      rescue StandardError
        0
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
