module Ib
  module Migration
    class DryRunService
      def initialize(batch:)
        @batch = batch
      end

      def run!
        preview = PreviewService.new(batch: batch)
        summary = preview.build do |row|
          result = evaluate_row(row)
          row.update!(
            status: result[:blocking] ? "blocked" : "ready",
            warnings: Array(result[:warnings]),
            error_messages: Array(result[:errors]),
            conflict_payload: result[:conflict_payload],
            resolution_payload: result[:resolution_payload] || {},
            target_entity_ref: result[:target_entity_ref],
            duplicate_candidate_ref: result[:duplicate_candidate_ref],
            unsupported_fields: Array(result[:unsupported_fields]),
            data_loss_risk: result[:data_loss_risk] || "low"
          )
          result
        end

        summary[:would_create] = summary.dig(:object_counts, :create).to_i
        summary[:would_update] = summary.dig(:object_counts, :update).to_i
        summary[:would_skip] = summary.dig(:object_counts, :skip).to_i
        summary[:blocked] = summary[:row_results].count { |row| row[:blocking] }

        batch.update!(
          status: summary[:blocked].positive? ? "blocked" : "ready_for_execute",
          validation_summary: {
            source_system: batch.source_system,
            required_fields: ContractRegistry.definition_for(source_system: batch.source_system, source_kind: batch.source_kind)[:required_fields],
            remap_required: summary[:remap_required],
            unsupported_field_count: summary[:unsupported_field_count],
            data_loss_risk: summary[:data_loss_risk]
          },
          preview_summary: summary,
          dry_run_summary: summary,
          last_dry_run_at: Time.current,
          preview_generated_at: Time.current,
          rollback_capabilities: {
            reversible: summary[:reversible],
            automatic_only_for_created: true,
            updated_records_require_manual_review: summary[:would_update].positive?
          }
        )
        Ib::Support::Telemetry.emit(
          event: "ib.import.batch.dry_run_completed",
          tenant: batch.tenant,
          user: batch.executed_by || batch.initiated_by,
          school: batch.school,
          metadata: {
            batch_id: batch.id,
            source_system: batch.source_system,
            blocked: summary[:blocked],
            would_create: summary[:would_create],
            would_update: summary[:would_update],
            would_skip: summary[:would_skip],
            data_loss_risk: summary[:data_loss_risk]
          },
        )
        summary
      end

      private

      attr_reader :batch

      def evaluate_row(row)
        payload = row.normalized_payload
        required_fields = ContractRegistry.definition_for(source_system: batch.source_system, source_kind: batch.source_kind)[:required_fields]
        case batch.source_kind
        when "pyp_poi"
          evaluate_pyp_poi(row, payload, required_fields: required_fields)
        when "curriculum_document"
          evaluate_document(row, payload, required_fields: required_fields)
        when "operational_record"
          evaluate_operational_record(row, payload, required_fields: required_fields)
        else
          {
            action: "skip",
            blocking: true,
            warnings: [],
            errors: [ "Unsupported source kind" ],
            conflict_payload: {},
            reversible: false,
            data_loss_risk: "high",
            unsupported_fields: row.unsupported_fields
          }
        end
      end

      def evaluate_pyp_poi(_row, payload, required_fields:)
        title = payload["title"].to_s
        missing = required_field_errors(payload, required_fields)
        existing = PypProgrammeOfInquiryEntry
          .joins(:pyp_programme_of_inquiry)
          .find_by(
            tenant_id: batch.tenant_id,
            title: title,
            pyp_programme_of_inquiries: { school_id: batch.school_id },
          )
        {
          action: existing ? "update" : "create",
          blocking: title.blank? || missing.any?,
          warnings: existing ? [ "Matching POI entry exists and will be updated." ] : [],
          errors: title.blank? ? [ "title is required" ] + missing : missing,
          conflict_payload: existing ? { duplicate_title: title } : {},
          reversible: existing.nil?,
          resolution_payload: existing ? { strategy: "update_existing" } : { strategy: "create_new" },
          duplicate_candidate_ref: existing ? "PypProgrammeOfInquiryEntry:#{existing.id}" : nil,
          data_loss_risk: row_risk(existing.present?),
          unsupported_fields: [],
          target_entity_ref: existing ? "PypProgrammeOfInquiryEntry:#{existing.id}" : nil
        }
      end

      def evaluate_document(row, payload, required_fields:)
        context_name = payload["planning_context_name"].to_s
        title = payload["title"].to_s
        existing = CurriculumDocument.find_by(tenant_id: batch.tenant_id, school_id: batch.school_id, title: title)
        blocking_errors = []
        blocking_errors << "planning_context_name is required" if context_name.blank?
        blocking_errors << "title is required" if title.blank?
        blocking_errors.concat(required_field_errors(payload, required_fields))
        {
          action: existing ? "update" : "create",
          blocking: blocking_errors.any?,
          warnings: existing ? [ "Matching document title exists and will be linked for review." ] : [],
          errors: blocking_errors,
          conflict_payload: {
            planning_context_name: context_name,
            existing_document: existing.present?
          },
          reversible: existing.nil?,
          resolution_payload: existing ? { strategy: "create_new_version" } : { strategy: "create_new_document" },
          duplicate_candidate_ref: existing ? "CurriculumDocument:#{existing.id}" : nil,
          data_loss_risk: row_risk(existing.present?, unsupported_fields: row.unsupported_fields),
          unsupported_fields: row.unsupported_fields,
          target_entity_ref: existing ? "CurriculumDocument:#{existing.id}" : nil
        }
      end

      def evaluate_operational_record(row, payload, required_fields:)
        title = payload["title"].to_s
        existing = IbOperationalRecord.find_by(tenant_id: batch.tenant_id, school_id: batch.school_id, title: title)
        missing = required_field_errors(payload, required_fields)
        {
          action: existing ? "update" : "create",
          blocking: title.blank? || missing.any?,
          warnings: existing ? [ "Matching operational record exists and will be updated." ] : [],
          errors: title.blank? ? [ "title is required" ] + missing : missing,
          conflict_payload: existing ? { duplicate_title: title } : {},
          reversible: existing.nil?,
          resolution_payload: existing ? { strategy: "update_existing" } : { strategy: "create_new" },
          duplicate_candidate_ref: existing ? "IbOperationalRecord:#{existing.id}" : nil,
          data_loss_risk: row_risk(existing.present?, unsupported_fields: row.unsupported_fields),
          unsupported_fields: row.unsupported_fields,
          target_entity_ref: existing ? "IbOperationalRecord:#{existing.id}" : nil
        }
      end

      def required_field_errors(payload, fields)
        Array(fields).filter_map do |field|
          "#{field} is required" if payload[field].blank?
        end
      end

      def row_risk(duplicate, unsupported_fields: [])
        return "high" if unsupported_fields.present?
        return "medium" if duplicate

        "low"
      end
    end
  end
end
