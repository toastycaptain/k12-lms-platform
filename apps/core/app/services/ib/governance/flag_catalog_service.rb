module Ib
  module Governance
    class FlagCatalogService
      FLAG_DEFINITIONS = {
        "curriculum_documents_v1" => {
          owner: "platform",
          stage: "tenant_ready",
          depends_on: [],
          kill_switch: false,
          bundle: "foundation"
        },
        "school_scoping_v1" => {
          owner: "platform",
          stage: "tenant_ready",
          depends_on: [ "curriculum_documents_v1" ],
          kill_switch: false,
          bundle: "foundation"
        },
        "ib_pack_v2" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "curriculum_documents_v1", "school_scoping_v1" ],
          kill_switch: false,
          bundle: "foundation"
        },
        "ib_pack_v2_workflows" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_pack_v2" ],
          kill_switch: false,
          bundle: "foundation"
        },
        "ib_teacher_console_v1" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_pack_v2_workflows" ],
          kill_switch: true,
          bundle: "teacher"
        },
        "ib_operations_center_v1" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_pack_v2_workflows" ],
          kill_switch: true,
          bundle: "coordinator"
        },
        "ib_programme_settings_v1" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_pack_v2" ],
          kill_switch: false,
          bundle: "coordinator"
        },
        "ib_evidence_subsystem_v1" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_pack_v2", "school_scoping_v1" ],
          kill_switch: true,
          bundle: "portfolio"
        },
        "ib_family_publishing_v1" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_evidence_subsystem_v1" ],
          kill_switch: true,
          bundle: "family"
        },
        "ib_guardian_calm_mode_v1" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_family_publishing_v1" ],
          kill_switch: false,
          bundle: "family"
        },
        "ib_standards_practices_live_v1" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_operations_center_v1" ],
          kill_switch: true,
          bundle: "coordinator"
        },
        "ib_documents_only_v1" => {
          owner: "ib",
          stage: "pilot_only",
          depends_on: [ "ib_pack_v2" ],
          kill_switch: true,
          bundle: "migration"
        },
        "ib_pilot_setup_v1" => {
          owner: "support",
          stage: "tenant_ready",
          depends_on: [ "ib_pack_v2" ],
          kill_switch: false,
          bundle: "release"
        },
        "ib_import_pipeline_v1" => {
          owner: "support",
          stage: "tenant_ready",
          depends_on: [ "ib_pilot_setup_v1", "ib_documents_only_v1" ],
          kill_switch: true,
          bundle: "migration"
        },
        "ib_job_operations_v1" => {
          owner: "support",
          stage: "tenant_ready",
          depends_on: [ "ib_import_pipeline_v1" ],
          kill_switch: false,
          bundle: "release"
        },
        "ib_onboarding_support_v1" => {
          owner: "support",
          stage: "tenant_ready",
          depends_on: [ "ib_pilot_setup_v1" ],
          kill_switch: false,
          bundle: "release"
        },
        "ib_friction_analytics_v1" => {
          owner: "support",
          stage: "tenant_ready",
          depends_on: [ "ib_teacher_console_v1" ],
          kill_switch: false,
          bundle: "teacher"
        },
        "ib_mobile_quick_actions_v2" => {
          owner: "ib",
          stage: "tenant_ready",
          depends_on: [ "ib_teacher_console_v1" ],
          kill_switch: true,
          bundle: "mobile"
        },
        "ib_document_consolidation_v1" => {
          owner: "platform",
          stage: "tenant_ready",
          depends_on: [ "ib_documents_only_v1" ],
          kill_switch: false,
          bundle: "migration"
        },
        "ib_shared_platform_primitives_v1" => {
          owner: "platform",
          stage: "tenant_ready",
          depends_on: [ "curriculum_documents_v1" ],
          kill_switch: false,
          bundle: "foundation"
        },
        "ib_ga_release_baseline_v1" => {
          owner: "support",
          stage: "phase8",
          depends_on: [ "ib_pilot_setup_v1" ],
          kill_switch: false,
          bundle: "release"
        },
        "ib_migration_moat_v1" => {
          owner: "support",
          stage: "phase8",
          depends_on: [ "ib_import_pipeline_v1", "ib_document_consolidation_v1" ],
          kill_switch: true,
          bundle: "migration"
        },
        "ib_reporting_v1" => {
          owner: "ib",
          stage: "phase8",
          depends_on: [ "ib_evidence_subsystem_v1", "ib_family_publishing_v1" ],
          kill_switch: true,
          bundle: "reporting"
        },
        "ib_realtime_collaboration_v1" => {
          owner: "ib",
          stage: "phase8",
          depends_on: [ "ib_teacher_console_v1" ],
          kill_switch: true,
          bundle: "collaboration"
        },
        "ib_teacher_speed_phase8_v1" => {
          owner: "ib",
          stage: "phase8",
          depends_on: [ "ib_realtime_collaboration_v1", "ib_friction_analytics_v1" ],
          kill_switch: true,
          bundle: "teacher"
        },
        "ib_coordinator_intelligence_v2" => {
          owner: "ib",
          stage: "phase8",
          depends_on: [ "ib_operations_center_v1" ],
          kill_switch: true,
          bundle: "coordinator"
        },
        "ib_family_trust_v1" => {
          owner: "ib",
          stage: "phase8",
          depends_on: [ "ib_guardian_calm_mode_v1", "ib_reporting_v1" ],
          kill_switch: true,
          bundle: "family"
        },
        "ib_mobile_sync_v1" => {
          owner: "ib",
          stage: "phase8",
          depends_on: [ "ib_mobile_quick_actions_v2" ],
          kill_switch: true,
          bundle: "mobile"
        },
        "ib_universal_search_v1" => {
          owner: "platform",
          stage: "phase8",
          depends_on: [ "ib_shared_platform_primitives_v1" ],
          kill_switch: true,
          bundle: "search"
        },
        "ib_saved_searches_v1" => {
          owner: "platform",
          stage: "phase8",
          depends_on: [ "ib_universal_search_v1" ],
          kill_switch: true,
          bundle: "search"
        },
        "ib_large_school_hardening_v1" => {
          owner: "platform",
          stage: "phase8",
          depends_on: [ "ib_universal_search_v1", "ib_job_operations_v1" ],
          kill_switch: false,
          bundle: "release"
        }
      }.freeze

      BUNDLES = {
        "foundation" => %w[
          curriculum_documents_v1
          school_scoping_v1
          ib_pack_v2
          ib_pack_v2_workflows
          ib_shared_platform_primitives_v1
        ],
        "teacher" => %w[
          ib_teacher_console_v1
          ib_friction_analytics_v1
          ib_teacher_speed_phase8_v1
        ],
        "coordinator" => %w[
          ib_operations_center_v1
          ib_programme_settings_v1
          ib_standards_practices_live_v1
          ib_coordinator_intelligence_v2
        ],
        "family" => %w[
          ib_family_publishing_v1
          ib_guardian_calm_mode_v1
          ib_reporting_v1
          ib_family_trust_v1
        ],
        "migration" => %w[
          ib_documents_only_v1
          ib_import_pipeline_v1
          ib_document_consolidation_v1
          ib_migration_moat_v1
        ],
        "collaboration" => %w[
          ib_realtime_collaboration_v1
        ],
        "search" => %w[
          ib_universal_search_v1
          ib_saved_searches_v1
        ],
        "mobile" => %w[
          ib_mobile_quick_actions_v2
          ib_mobile_sync_v1
        ],
        "release" => %w[
          ib_pilot_setup_v1
          ib_job_operations_v1
          ib_onboarding_support_v1
          ib_ga_release_baseline_v1
          ib_large_school_hardening_v1
        ],
        "ga_candidate" => FeatureFlag::IB_PHASE8_REQUIRED_FLAGS
      }.freeze

      def initialize(tenant:)
        @tenant = tenant
      end

      def inventory
        snapshot = FeatureFlag.ib_phase8_snapshot(tenant: tenant)

        FLAG_DEFINITIONS.map do |key, definition|
          {
            key: key,
            enabled: snapshot.fetch(key, false),
            owner: definition.fetch(:owner),
            stage: definition.fetch(:stage),
            depends_on: definition.fetch(:depends_on),
            bundle: definition.fetch(:bundle),
            kill_switch: definition.fetch(:kill_switch),
            dependency_health: dependency_health(definition.fetch(:depends_on), snapshot)
          }
        end
      end

      def bundle_payload(bundle_key)
        keys = BUNDLES.fetch(bundle_key.to_s, [])
        snapshot = FeatureFlag.snapshot(keys, tenant: tenant)

        {
          key: bundle_key.to_s,
          flags: snapshot.map { |key, enabled| { key: key, enabled: enabled } },
          enabled_count: snapshot.values.count(true),
          complete: snapshot.values.all?
        }
      end

      def bundles
        BUNDLES.keys.map { |key| bundle_payload(key) }
      end

      def kill_switches
        inventory.select { |row| row[:kill_switch] }
      end

      private

      attr_reader :tenant

      def dependency_health(keys, snapshot)
        Array(keys).all? { |key| snapshot.fetch(key, false) }
      end
    end
  end
end
