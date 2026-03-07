module Ib
  module Search
    class ProfileService
      RESULT_GROUPS = %w[document evidence story report standards_packet operational_record task comment library_item portfolio_collection].freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        {
          generated_at: Time.current.utc.iso8601,
          result_groups: RESULT_GROUPS,
          entity_inventory: entity_inventory,
          profiles: profile_scope.order(updated_at: :desc, id: :desc).map { |profile| serialize_profile(profile) }
        }
      end

      def upsert_profile!(attrs)
        profile = attrs[:id].present? ? profile_scope.find(attrs[:id]) : profile_scope.find_or_initialize_by(key: attrs[:key])
        profile.assign_attributes(
          school: school,
          created_by: actor || profile.created_by,
          key: attrs[:key].presence || profile.key,
          status: attrs[:status].presence || profile.status || "draft",
          latency_budget_ms: attrs[:latency_budget_ms].presence || profile.latency_budget_ms || 800,
          facet_config: profile.facet_config.merge(normalize_hash(attrs[:facet_config])),
          ranking_rules: profile.ranking_rules.merge(normalize_hash(attrs[:ranking_rules])),
          scope_rules: profile.scope_rules.merge(normalize_hash(attrs[:scope_rules])),
          metadata: profile.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        profile.save!
        serialize_profile(profile)
      end

      private

      attr_reader :tenant, :school, :actor

      def profile_scope
        scope = IbSearchProfile.where(tenant_id: tenant.id)
        scope = scope.where(school_id: [ school&.id, nil ].compact) if school
        scope
      end

      def entity_inventory
        {
          documents: count_for(CurriculumDocument),
          evidence: count_for(IbEvidenceItem),
          stories: count_for(IbLearningStory),
          reports: count_for(IbReport),
          operational_records: count_for(IbOperationalRecord),
          collaboration_tasks: count_for(IbCollaborationTask),
          comments: count_for(IbDocumentComment)
        }
      end

      def serialize_profile(profile)
        {
          id: profile.id,
          key: profile.key,
          status: profile.status,
          latency_budget_ms: profile.latency_budget_ms,
          facet_config: profile.facet_config,
          ranking_rules: profile.ranking_rules,
          scope_rules: profile.scope_rules,
          updated_at: profile.updated_at.utc.iso8601
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
