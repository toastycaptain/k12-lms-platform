module Ib
  module Migration
    class ImportBatchService
      def initialize(tenant:, school:, actor:)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def create!(source_kind:, source_format:, source_filename:, raw_payload:, academic_year: nil, programme: "Mixed", mapping_payload: {})
        parsed = Parser.parse(source_format: source_format, raw_payload: raw_payload)
        sanitized_mapping = mapping_payload.to_h.stringify_keys

        batch = IbImportBatch.create!(
          tenant: tenant,
          school: school,
          academic_year: academic_year,
          programme: programme,
          status: "staged",
          source_kind: source_kind,
          source_format: source_format,
          source_filename: source_filename,
          raw_payload: raw_payload,
          scope_metadata: {
            "school_id" => school.id,
            "academic_year_id" => academic_year&.id,
            "programme" => programme
          },
          mapping_payload: sanitized_mapping,
          parser_warnings: parsed[:warnings],
          initiated_by: actor,
        )

        parsed[:rows].each do |row|
          mapped = SourceMapper.map_row(source_kind: source_kind, payload: row[:payload])
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
            mapping_payload: sanitized_mapping,
          )
        end

        Ib::Support::Telemetry.emit(
          event: "ib.import.batch.created",
          tenant: tenant,
          user: actor,
          school: school,
          metadata: {
            batch_id: batch.id,
            source_kind: source_kind,
            source_format: source_format,
            row_count: batch.rows.count
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
          Ib::Migration::ImportExecutionJob.perform_later(batch.id, actor.id)
          return { "queued" => true, "batch_id" => batch.id }
        end

        ExecutionService.new(batch: batch, actor: actor).run!
      end

      def rollback!(batch:)
        ExecutionService.new(batch: batch, actor: actor).rollback!
      end

      private

      attr_reader :tenant, :school, :actor
    end
  end
end
