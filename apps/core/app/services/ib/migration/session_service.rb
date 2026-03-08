module Ib
  module Migration
    class SessionService
      CUTOVER_STATES = IbMigrationSession::STATUS_TYPES.map do |state|
        { key: state, label: state.tr("_", " ").titleize }
      end.freeze

      SOURCE_CONTRACTS = {
        "toddle" => {
          assumptions: [
            "Exports are section-oriented and narrative-heavy.",
            "Learning stories and POI structures may arrive in separate files.",
            "Guardian identities often need post-import reconciliation."
          ]
        },
        "managebac" => {
          assumptions: [
            "Exports are programme and cycle oriented.",
            "DP records may be spread across IA/core exports.",
            "Registrar bridges require explicit identity mapping."
          ]
        }
      }.freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        {
          generated_at: Time.current.utc.iso8601,
          lifecycle: CUTOVER_STATES,
          source_contracts: SOURCE_CONTRACTS,
          adapter_protocols: Curriculum::MigrationConnectorSDK.connectors,
          shared_import_manifest: Curriculum::MigrationConnectorSDK.shared_manifest,
          template_generators: Curriculum::MigrationConnectorSDK.template_generators,
          source_artifact_discovery: Curriculum::MigrationConnectorSDK.source_artifact_discovery,
          inventory_summary: inventory_summary,
          confidence_summary: confidence_summary,
          sessions: scoped_sessions.order(updated_at: :desc, id: :desc).map { |session| serialize_session(session) },
          mapping_templates: template_scope.order(updated_at: :desc, id: :desc).map { |template| serialize_template(template) }
        }
      end

      def upsert_session!(attrs)
        session = attrs[:id].present? ? scoped_sessions.find(attrs[:id]) : scoped_sessions.find_or_initialize_by(session_key: attrs[:session_key])
        next_state = attrs[:cutover_state].presence || session.cutover_state || "disconnected"
        validate_transition!(session.cutover_state.presence || next_state, next_state) if session.persisted?

        session.assign_attributes(
          school: school,
          academic_year: current_academic_year,
          initiated_by: actor || session.initiated_by,
          ib_pilot_profile_id: attrs[:ib_pilot_profile_id],
          ib_import_batch_id: attrs[:ib_import_batch_id],
          source_system: attrs[:source_system].presence || session.source_system || "generic",
          status: attrs[:status].presence || next_state,
          cutover_state: next_state,
          session_key: attrs[:session_key].presence || session.session_key || SecureRandom.hex(8),
          source_inventory: inventory_for(attrs),
          mapping_summary: session.mapping_summary.merge(normalize_hash(attrs[:mapping_summary])),
          dry_run_summary: session.dry_run_summary.merge(normalize_hash(attrs[:dry_run_summary])),
          reconciliation_summary: session.reconciliation_summary.merge(normalize_hash(attrs[:reconciliation_summary])),
          rollback_summary: session.rollback_summary.merge(normalize_hash(attrs[:rollback_summary])),
          metadata: session.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        session.save!
        serialize_session(session)
      end

      def upsert_template!(attrs)
        template = attrs[:id].present? ? template_scope.find(attrs[:id]) : template_scope.find_or_initialize_by(name: attrs[:name], source_system: attrs[:source_system])
        template.assign_attributes(
          school: school,
          created_by: actor || template.created_by,
          source_system: attrs[:source_system].presence || template.source_system || "generic",
          programme: attrs[:programme].presence || template.programme || "Mixed",
          name: attrs[:name].presence || template.name,
          status: attrs[:status].presence || template.status || "draft",
          shared: ActiveModel::Type::Boolean.new.cast(attrs[:shared]),
          field_mappings: template.field_mappings.merge(normalize_hash(attrs[:field_mappings])),
          transform_library: template.transform_library.merge(normalize_hash(attrs[:transform_library])),
          role_mapping_rules: template.role_mapping_rules.merge(normalize_hash(attrs[:role_mapping_rules])),
          metadata: template.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        template.save!
        serialize_template(template)
      end

      private

      attr_reader :tenant, :school, :actor

      def scoped_sessions
        scope = IbMigrationSession.where(tenant_id: tenant.id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def template_scope
        scope = IbMigrationMappingTemplate.where(tenant_id: tenant.id)
        scope = scope.where(school_id: [ school&.id, nil ].compact) if school
        scope
      end

      def inventory_summary
        batch_scope = IbImportBatch.where(tenant_id: tenant.id)
        batch_scope = batch_scope.where(school_id: school.id) if school
        {
          source_systems: batch_scope.group(:source_system).count,
          source_kinds: batch_scope.group(:source_kind).count,
          import_modes: batch_scope.group(:import_mode).count,
          ready_for_execute: batch_scope.where(status: "ready_for_execute").count,
          completed: batch_scope.where(status: "completed").count,
          shadow_mode_ready: batch_scope.where(coexistence_mode: true).count,
          rollbackable_batches: batch_scope.where(status: %w[completed rolled_back]).count
        }
      end

      def inventory_for(attrs)
        existing = normalize_hash(attrs[:source_inventory])
        return existing if existing.present?

        import_batch = IbImportBatch.find_by(id: attrs[:ib_import_batch_id]) if attrs[:ib_import_batch_id].present?
        return {} unless import_batch

        {
          "filename" => import_batch.source_filename,
          "source_kind" => import_batch.source_kind,
          "source_system" => import_batch.source_system,
          "row_count" => import_batch.rows.count
        }
      end

      def serialize_session(session)
        import_batch = session.ib_import_batch
        protocol = Curriculum::MigrationConnectorSDK.connector_for(source_system: session.source_system)
        {
          id: session.id,
          session_key: session.session_key,
          source_system: session.source_system,
          status: session.status,
          cutover_state: session.cutover_state,
          source_inventory: session.source_inventory,
          mapping_summary: session.mapping_summary,
          dry_run_summary: session.dry_run_summary,
          reconciliation_summary: session.reconciliation_summary,
          rollback_summary: session.rollback_summary,
          source_contract: SOURCE_CONTRACTS.fetch(session.source_system, SOURCE_CONTRACTS["toddle"]),
          source_manifest: import_batch&.preview_summary&.dig("source_artifact_manifest") || {},
          shadow_mode: {
            enabled: import_batch&.coexistence_mode || session.cutover_state == "shadow_mode",
            rollout_mode: protocol[:rollout_mode],
            ready_for_compare: session.cutover_state.in?(%w[shadow_mode cutover_ready cutover_live])
          },
          delta_rerun: {
            enabled: protocol[:delta_rerun],
            resume_cursor: import_batch&.resume_cursor,
            source_checksum: import_batch&.source_checksum
          },
          acceptance_summary: {
            dry_run_complete: session.dry_run_summary.present?,
            rollback_documented: session.rollback_summary.present? || import_batch&.rollback_capabilities.present?,
            reconciliation_open_items: session.reconciliation_summary.fetch("open_items", 0)
          },
          created_at: session.created_at.utc.iso8601,
          updated_at: session.updated_at.utc.iso8601
        }
      end

      def serialize_template(template)
        {
          id: template.id,
          source_system: template.source_system,
          programme: template.programme,
          name: template.name,
          status: template.status,
          shared: template.shared,
          field_mappings: template.field_mappings,
          transform_library: template.transform_library,
          role_mapping_rules: template.role_mapping_rules,
          manual_override_panels: %w[field_mapping rules_engine conflict_resolution],
          updated_at: template.updated_at.utc.iso8601
        }
      end

      def validate_transition!(from, to)
        return if from == to

        allowed = {
          "disconnected" => %w[discovered archived],
          "discovered" => %w[mapped archived failed],
          "mapped" => %w[dry_run_complete archived failed],
          "dry_run_complete" => %w[draft_imported rolled_back failed],
          "draft_imported" => %w[shadow_mode rolled_back failed],
          "shadow_mode" => %w[cutover_ready rolled_back failed],
          "cutover_ready" => %w[cutover_live rolled_back failed],
          "cutover_live" => %w[rolled_back archived],
          "rolled_back" => %w[archived],
          "archived" => []
        }.fetch(from, [])
        return if allowed.include?(to)

        raise ArgumentError, "Invalid migration transition from #{from} to #{to}"
      end

      def current_academic_year
        @current_academic_year ||= AcademicYear.where(tenant_id: tenant.id).order(start_date: :desc, id: :desc).first
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end

      def confidence_summary
        sessions = scoped_sessions
        {
          total_sessions: sessions.count,
          cutover_ready: sessions.where(cutover_state: "cutover_ready").count,
          shadow_mode: sessions.where(cutover_state: "shadow_mode").count,
          failed: sessions.where(status: "failed").count,
          rollback_plans: sessions.where.not(rollback_summary: {}).count
        }
      end
    end
  end
end
