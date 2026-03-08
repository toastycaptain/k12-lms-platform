module Ib
  module Migration
    class ImportBatchService
      def initialize(tenant:, school:, actor:)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def create!(
        source_kind:,
        source_format:,
        source_filename:,
        raw_payload:,
        academic_year: nil,
        programme: "Mixed",
        mapping_payload: {},
        source_system: "generic",
        import_mode: "draft",
        coexistence_mode: false
      )
        parsed = Parser.parse(source_format: source_format, raw_payload: raw_payload)
        sanitized_mapping = mapping_payload.to_h.stringify_keys
        adapter_protocol = ContractRegistry.adapter_protocol_for(source_system: source_system)
        artifact_manifest = artifact_manifest_for(
          parsed_rows: parsed[:rows],
          source_filename: source_filename,
          source_system: source_system,
          source_kind: source_kind,
          source_format: source_format
        )

        batch = IbImportBatch.create!(
          tenant: tenant,
          school: school,
          academic_year: academic_year,
          programme: programme,
          status: "staged",
          source_kind: source_kind,
          source_format: source_format,
          source_system: source_system,
          import_mode: import_mode,
          coexistence_mode: coexistence_mode,
          source_contract_version: adapter_protocol[:protocol_version],
          source_filename: source_filename,
          raw_payload: raw_payload,
          scope_metadata: {
            "school_id" => school.id,
            "academic_year_id" => academic_year&.id,
            "programme" => programme,
            "source_system" => source_system,
            "import_mode" => import_mode,
            "coexistence_mode" => coexistence_mode,
            "source_adapter" => adapter_protocol[:connector]
          },
          mapping_payload: sanitized_mapping,
          parser_warnings: parsed[:warnings],
          preview_summary: {
            "source_artifact_manifest" => artifact_manifest,
            "adapter_protocol" => adapter_protocol,
            "shared_import_manifest" => ContractRegistry.shared_import_manifest
          },
          rollback_capabilities: {
            "reversible" => true,
            "draft_only_target_model" => true,
            "shadow_mode_supported" => adapter_protocol[:shadow_mode],
            "delta_rerun_supported" => adapter_protocol[:delta_rerun]
          },
          initiated_by: actor,
        )

        parsed[:rows].each do |row|
          mapped = SourceMapper.map_row(
            source_system: source_system,
            source_kind: source_kind,
            payload: row[:payload]
          )
          batch.rows.create!(
            tenant: tenant,
            row_index: row[:row_index],
            sheet_name: row[:sheet_name],
            source_identifier: row[:source_identifier],
            source_payload: row[:payload],
            normalized_payload: SourceMapper.apply_mapping(
              normalized_payload: mapped[:normalized_payload],
              mapping_payload: sanitized_mapping,
            ),
            warnings: Array(row[:warnings]) + Array(mapped[:warnings]),
            unsupported_fields: Array(mapped[:unsupported_fields]),
            mapping_payload: sanitized_mapping,
            entity_kind: source_kind,
          )
        end

        Ib::Support::Telemetry.emit(
          event: "ib.import.batch.created",
          tenant: tenant,
          user: actor,
          school: school,
          metadata: {
            batch_id: batch.id,
            source_system: source_system,
            source_kind: source_kind,
            source_format: source_format,
            row_count: batch.rows.count,
            source_contract_version: batch.source_contract_version
          },
        )

        batch
      end

      def update_mapping!(batch:, mapping_payload:)
        merged_mapping = batch.mapping_payload.merge(mapping_payload.to_h.stringify_keys)
        batch.update!(mapping_payload: merged_mapping, status: "mapped")
        batch.rows.find_each do |row|
          row.update!(
            mapping_payload: row.mapping_payload.merge(merged_mapping),
            normalized_payload: SourceMapper.apply_mapping(
              normalized_payload: row.normalized_payload,
              mapping_payload: merged_mapping,
            ),
            status: "mapped",
          )
        end
        Ib::Support::Telemetry.emit(
          event: "ib.import.batch.mapping_updated",
          tenant: tenant,
          user: actor,
          school: school,
          metadata: { batch_id: batch.id, mapping_keys: merged_mapping.keys.sort },
        )
        batch
      end

      def dry_run!(batch:)
        DryRunService.new(batch: batch).run!
      end

      def execute!(batch:, async: false)
        if async || batch.rows.count > 50
          batch.update!(status: "executing", executed_by: actor)
          job = Ib::Migration::ImportExecutionJob.perform_later(batch.id, actor.id)
          tracked_job = Ib::Support::OperationalJobTracker.register_enqueue!(
            job: job,
            operation_key: "import_execute",
            tenant: batch.tenant,
            school: batch.school,
            actor: actor,
            source_record: batch,
            payload: {
              batch_id: batch.id,
              source_system: batch.source_system,
              source_kind: batch.source_kind,
              row_count: batch.rows.count,
              resume_cursor: batch.resume_cursor
            },
            idempotency_key: "#{batch.source_checksum}:#{batch.resume_cursor}"
          )
          batch.update!(last_enqueued_job_id: tracked_job.id)
          return { "queued" => true, "batch_id" => batch.id }
        end

        ExecutionService.new(batch: batch, actor: actor).run!
      end

      def rollback!(batch:)
        ExecutionService.new(batch: batch, actor: actor).rollback!
      end

      private

      attr_reader :tenant, :school, :actor

      def artifact_manifest_for(parsed_rows:, source_filename:, source_system:, source_kind:, source_format:)
        {
          "source_filename" => source_filename,
          "source_system" => source_system,
          "source_kind" => source_kind,
          "source_format" => source_format,
          "row_count" => Array(parsed_rows).length,
          "artifacts" => Array(parsed_rows).group_by { |row| row[:sheet_name] || "source" }.transform_values do |rows|
            {
              "row_count" => rows.length,
              "sample_identifiers" => rows.first(3).map { |row| row[:source_identifier] }
            }
          end
        }
      end
    end
  end
end
