module Ib
  module Governance
    class RolloutConsoleService
      PACK_KEY = "ib_continuum_v1".freeze
      CURRENT_PACK_VERSION = "2026.2".freeze

      def initialize(tenant:, school: nil, include_release_baseline: true)
        @tenant = tenant
        @school = school
        @include_release_baseline = include_release_baseline
      end

      def build
        {
          active_pack: active_pack,
          shared_console_contract: Curriculum::GovernanceConsoleRegistry.contract_for(pack: active_pack_payload),
          feature_flags: feature_flags,
          release_baseline: release_baseline,
          pilot_baseline: pilot_baseline,
          pilot_setup: pilot_setup,
          route_readiness: route_readiness,
          migration_drift: migration_drift,
          programme_settings: programme_settings,
          academic_year: academic_year_status,
          legacy_usage: legacy_usage,
          generated_at: Time.current.utc.iso8601
        }
      end

      private

      attr_reader :tenant, :school, :include_release_baseline

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

      def active_pack_payload
        @active_pack_payload ||= CurriculumPackStore.fetch(
          tenant: tenant,
          key: active_pack[:key],
          version: active_pack[:version]
        ) || {}
      end

      def feature_flags
        catalog = FlagCatalogService.new(tenant: tenant)
        snapshot = FeatureFlag.ib_phase8_snapshot(tenant: tenant)
        {
          required: snapshot.map { |key, enabled| { key: key, enabled: enabled } },
          healthy: snapshot.values.all?,
          bundles: catalog.bundles,
          inventory: catalog.inventory,
          kill_switches: catalog.kill_switches
        }
      end

      def release_baseline
        return nil unless include_release_baseline

        ReleaseBaselineService.new(
          tenant: tenant,
          school: school
        ).build.except(:rollout, :readiness)
      end

      def pilot_baseline
        ::Ib::Support::PilotBaselineService.new(tenant: tenant, school: school).verify
      end

      def pilot_setup
        scoped_school = school || School.where(tenant_id: tenant.id).first
        return nil if scoped_school.nil?

        ::Ib::Support::PilotSetupStatusEngine.new(tenant: tenant, school: scoped_school).build
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
