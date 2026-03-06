module Ib
  module Governance
    class RolloutConsoleService
      PACK_KEY = "ib_continuum_v1".freeze
      CURRENT_PACK_VERSION = "2026.2".freeze

      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def build
        {
          active_pack: active_pack,
          feature_flags: feature_flags,
          route_readiness: route_readiness,
          migration_drift: migration_drift,
          programme_settings: programme_settings,
          academic_year: academic_year_status,
          legacy_usage: legacy_usage,
          generated_at: Time.current.utc.iso8601
        }
      end

      private

      attr_reader :tenant, :school

      def ib_documents
        scope = CurriculumDocument.where(tenant_id: tenant.id, pack_key: PACK_KEY)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def ib_operational_records
        scope = IbOperationalRecord.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def active_pack
        resolved = CurriculumProfileResolver.resolve(tenant: tenant, school: school)
        {
          key: resolved[:profile_key],
          version: resolved[:resolved_profile_version],
          expected_version: CURRENT_PACK_VERSION,
          using_current_pack: resolved[:profile_key] == PACK_KEY && resolved[:resolved_profile_version] == CURRENT_PACK_VERSION,
          deprecated_record_count: ib_documents.where.not(pack_version: CURRENT_PACK_VERSION).count
        }
      end

      def feature_flags
        snapshot = FeatureFlag.ib_phase5_snapshot(tenant: tenant)
        {
          required: snapshot.map { |key, enabled| { key: key, enabled: enabled } },
          healthy: snapshot.values.all?
        }
      end

      def route_readiness
        document_hrefs = ib_documents.limit(500).map { |document| ::Ib::RouteBuilder.href_for(document) }
        operational_hrefs = ib_operational_records.limit(500).map { |record| ::Ib::RouteBuilder.href_for(record) }
        hrefs = document_hrefs + operational_hrefs
        canonical = hrefs.count { |href| href.start_with?("/ib/") }

        {
          checked_count: hrefs.length,
          canonical_count: canonical,
          fallback_count: hrefs.length - canonical,
          healthy: hrefs.empty? || canonical == hrefs.length
        }
      end

      def migration_drift
        documents = ib_documents
        {
          document_count: documents.count,
          by_pack_version: documents.group(:pack_version).count,
          by_schema_key: documents.group(:schema_key).count,
          missing_schema_key: documents.where(schema_key: [ nil, "" ]).count,
          missing_route_hint_records: ib_operational_records.where(route_hint: [ nil, "" ]).count
        }
      end

      def programme_settings
        resolved = ProgrammeSettingsResolver.new(tenant: tenant, school: school).resolve
        {
          rows: resolved,
          complete_count: resolved.count { |row| row[:complete] },
          incomplete_programmes: resolved.reject { |row| row[:complete] }.map { |row| row[:programme] }
        }
      end

      def academic_year_status
        contexts = PlanningContext.where(tenant_id: tenant.id)
        contexts = contexts.where(school_id: school.id) if school
        pinned = contexts.where.not(academic_year_id: nil).count

        {
          planning_context_count: contexts.count,
          pinned_context_count: pinned,
          healthy: contexts.count.zero? || pinned == contexts.count
        }
      end

      def legacy_usage
        {
          legacy_document_routes: ib_documents.limit(500).count { |document| ::Ib::RouteBuilder.href_for(document).start_with?("/plan/") },
          legacy_operational_routes: ib_operational_records.where("route_hint LIKE ?", "/plan/%").count,
          demo_routes: ib_operational_records.where("route_hint LIKE ?", "%/demo%").count
        }
      end
    end
  end
end
