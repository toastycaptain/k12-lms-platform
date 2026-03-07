module Ib
  module Migration
    class DryRunService
      def initialize(batch:)
        @batch = batch
      end

      def run!
        summary = {
          would_create: 0,
          would_update: 0,
          would_skip: 0,
          blocked: 0,
          warnings: 0,
          reversible: true,
          row_results: []
        }

        batch.rows.find_each do |row|
          result = evaluate_row(row)
          row.update!(
            status: result[:blocking] ? "blocked" : "ready",
            warnings: Array(result[:warnings]),
            error_messages: Array(result[:errors]),
            conflict_payload: result[:conflict_payload],
            target_entity_ref: result[:target_entity_ref],
          )
          summary[:would_create] += 1 if result[:action] == "create"
          summary[:would_update] += 1 if result[:action] == "update"
          summary[:would_skip] += 1 if result[:action] == "skip"
          summary[:blocked] += 1 if result[:blocking]
          summary[:warnings] += Array(result[:warnings]).length
          summary[:reversible] &&= result[:reversible]
          summary[:row_results] << result.merge(row_id: row.id, source_identifier: row.source_identifier)
        end

        batch.update!(
          status: summary[:blocked].positive? ? "blocked" : "ready_for_execute",
          dry_run_summary: summary,
          last_dry_run_at: Time.current,
        )
        Ib::Support::Telemetry.emit(
          event: "ib.import.batch.dry_run_completed",
          tenant: batch.tenant,
          user: batch.executed_by || batch.initiated_by,
          school: batch.school,
          metadata: {
            batch_id: batch.id,
            blocked: summary[:blocked],
            would_create: summary[:would_create],
            would_update: summary[:would_update],
            would_skip: summary[:would_skip]
          },
        )
        summary
      end

      private

      attr_reader :batch

      def evaluate_row(row)
        payload = row.normalized_payload
        case batch.source_kind
        when "pyp_poi"
          evaluate_pyp_poi(row, payload)
        when "curriculum_document"
          evaluate_document(row, payload)
        when "operational_record"
          evaluate_operational_record(row, payload)
        else
          { action: "skip", blocking: true, warnings: [], errors: [ "Unsupported source kind" ], conflict_payload: {}, reversible: false }
        end
      end

      def evaluate_pyp_poi(_row, payload)
        title = payload["title"].to_s
        existing = PypProgrammeOfInquiryEntry
          .joins(:pyp_programme_of_inquiry)
          .find_by(
            tenant_id: batch.tenant_id,
            title: title,
            pyp_programme_of_inquiries: { school_id: batch.school_id },
          )
        {
          action: existing ? "update" : "create",
          blocking: title.blank?,
          warnings: existing ? [ "Matching POI entry exists and will be updated." ] : [],
          errors: title.blank? ? [ "title is required" ] : [],
          conflict_payload: existing ? { duplicate_title: title } : {},
          reversible: existing.nil?,
          target_entity_ref: existing ? "PypProgrammeOfInquiryEntry:#{existing.id}" : nil
        }
      end

      def evaluate_document(_row, payload)
        context_name = payload["planning_context_name"].to_s
        title = payload["title"].to_s
        existing = CurriculumDocument.find_by(tenant_id: batch.tenant_id, school_id: batch.school_id, title: title)
        blocking_errors = []
        blocking_errors << "planning_context_name is required" if context_name.blank?
        blocking_errors << "title is required" if title.blank?
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
          target_entity_ref: existing ? "CurriculumDocument:#{existing.id}" : nil
        }
      end

      def evaluate_operational_record(_row, payload)
        title = payload["title"].to_s
        existing = IbOperationalRecord.find_by(tenant_id: batch.tenant_id, school_id: batch.school_id, title: title)
        {
          action: existing ? "update" : "create",
          blocking: title.blank?,
          warnings: existing ? [ "Matching operational record exists and will be updated." ] : [],
          errors: title.blank? ? [ "title is required" ] : [],
          conflict_payload: existing ? { duplicate_title: title } : {},
          reversible: existing.nil?,
          target_entity_ref: existing ? "IbOperationalRecord:#{existing.id}" : nil
        }
      end
    end
  end
end
