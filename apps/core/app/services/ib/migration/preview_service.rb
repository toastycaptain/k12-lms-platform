module Ib
  module Migration
    class PreviewService
      def initialize(batch:)
        @batch = batch
      end

      def build
        summary = {
          source_system: batch.source_system,
          source_kind: batch.source_kind,
          import_mode: batch.import_mode,
          coexistence_mode: batch.coexistence_mode,
          object_counts: Hash.new(0),
          warnings: 0,
          conflicts: 0,
          unsupported_field_count: 0,
          high_risk_rows: 0,
          duplicate_candidates: 0,
          data_loss_risk: "low",
          remap_required: 0,
          reversible: true,
          row_results: []
        }

        batch.rows.find_each do |row|
          result = yield(row)
          summary[:object_counts][result[:action]] += 1 if result[:action].present?
          summary[:warnings] += Array(result[:warnings]).length
          summary[:conflicts] += 1 if result[:conflict_payload].present?
          summary[:unsupported_field_count] += Array(result[:unsupported_fields]).length
          summary[:high_risk_rows] += 1 if result[:data_loss_risk] == "high"
          summary[:duplicate_candidates] += 1 if result[:duplicate_candidate_ref].present?
          summary[:remap_required] += 1 if Array(result[:errors]).grep(/required|unsupported/i).any?
          summary[:reversible] &&= result[:reversible]
          summary[:row_results] << result.merge(row_id: row.id, source_identifier: row.source_identifier)
        end

        summary[:data_loss_risk] =
          if summary[:high_risk_rows].positive?
            "high"
          elsif summary[:unsupported_field_count].positive? || summary[:conflicts].positive?
            "medium"
          else
            "low"
          end

        summary
      end

      private

      attr_reader :batch
    end
  end
end
