module Ib
  module Migration
    class ExecutionService
      def initialize(batch:, actor:)
        @batch = batch
        @actor = actor
      end

      def run!
        raise ArgumentError, "Import batch is blocked" if blocking_rows.exists?

        created_refs = []
        updated_refs = []
        skipped_refs = []
        batch.transaction do
          batch.update!(
            status: "executing",
            executed_by: actor,
            resume_cursor: 0,
            recovery_payload: batch.recovery_payload.merge(
              "last_started_at" => Time.current.utc.iso8601,
              "last_actor_id" => actor&.id
            )
          )
          batch.rows.where(status: "ready").find_each do |row|
            outcome = execute_row!(row)
            batch.update!(
              resume_cursor: row.row_index,
              recovery_payload: batch.recovery_payload.merge(
                "last_row_id" => row.id,
                "last_row_index" => row.row_index,
                "last_row_status" => row.status
              )
            )
            next if outcome.nil?

            created_refs << outcome[:entity_ref] if outcome[:action] == "create"
            updated_refs << outcome[:entity_ref] if outcome[:action] == "update"
            skipped_refs << outcome[:entity_ref] if outcome[:action] == "skip"
          end
          batch.update!(
            status: "completed",
            executed_at: Time.current,
            execution_summary: {
              created_refs: created_refs,
              updated_refs: updated_refs,
              skipped_refs: skipped_refs,
              created_count: created_refs.length,
              updated_count: updated_refs.length,
              skipped_count: skipped_refs.length,
              import_mode: batch.import_mode,
              coexistence_mode: batch.coexistence_mode,
              resume_cursor: batch.resume_cursor
            },
            recovery_payload: batch.recovery_payload.merge(
              "last_completed_at" => Time.current.utc.iso8601,
              "recoverable" => false
            )
          )
        end
        Ib::Support::Telemetry.emit(
          event: "ib.import.batch.executed",
          tenant: batch.tenant,
          user: actor,
          school: batch.school,
          metadata: {
            batch_id: batch.id,
            created_count: created_refs.length,
            updated_count: updated_refs.length,
            skipped_count: skipped_refs.length
          },
        )
        batch.execution_summary
      rescue StandardError => e
        batch.update!(
          status: "failed",
          error_message: e.message,
          recovery_payload: batch.recovery_payload.merge(
            "recoverable" => true,
            "last_failed_at" => Time.current.utc.iso8601,
            "resume_cursor" => batch.resume_cursor,
            "error_class" => e.class.name,
            "error_message" => e.message
          )
        )
        raise
      end

      def rollback!
        summary = batch.execution_summary.deep_dup
        created_refs = Array(summary["created_refs"] || summary[:created_refs])
        rolled_back = []
        skipped = []

        created_refs.each do |ref|
          if destroy_ref(ref)
            rolled_back << ref
          else
            skipped << ref
          end
        end

        batch.update!(
          status: "rolled_back",
          rolled_back_at: Time.current,
          rollback_summary: { rolled_back_refs: rolled_back, skipped_refs: skipped },
        )

        Ib::Support::Telemetry.emit(
          event: "ib.import.batch.rolled_back",
          tenant: batch.tenant,
          user: actor,
          school: batch.school,
          metadata: { batch_id: batch.id, rolled_back_count: rolled_back.length, skipped_count: skipped.length },
        )

        batch.rollback_summary
      end

      private

      attr_reader :batch, :actor

      def blocking_rows
        batch.rows.where(status: "blocked")
      end

      def execute_row!(row)
        payload = row.normalized_payload
        case batch.source_kind
        when "pyp_poi"
          board = PypProgrammeOfInquiry.where(tenant_id: batch.tenant_id, school_id: batch.school_id).first_or_create!(
            tenant_id: batch.tenant_id,
            school_id: batch.school_id,
            title: "Imported Programme of Inquiry",
            status: batch.import_mode == "live" && !batch.coexistence_mode ? "published" : "draft",
            created_by_id: actor.id,
          )
          entry = PypProgrammeOfInquiryEntry
            .joins(:pyp_programme_of_inquiry)
            .find_by(
              tenant_id: batch.tenant_id,
              title: payload["title"],
              pyp_programme_of_inquiries: { school_id: batch.school_id },
            ) || PypProgrammeOfInquiryEntry.new(tenant_id: batch.tenant_id, title: payload["title"])
          action = entry.persisted? ? "update" : "create"
          entry.assign_attributes(
            pyp_programme_of_inquiry: board,
            year_level: payload["year_level"],
            theme: payload["theme"],
            central_idea: payload["central_idea"],
            review_state: batch.import_mode == "live" && !batch.coexistence_mode ? "published" : (payload["review_state"] || entry.review_state || "draft"),
            coherence_signal: entry.coherence_signal || "healthy",
            metadata: (entry.metadata || {}).merge(
              "import_batch_id" => batch.id,
              "source_system" => batch.source_system,
              "coexistence_mode" => batch.coexistence_mode
            ),
          )
          entry.save!
          ref = "PypProgrammeOfInquiryEntry:#{entry.id}"
          row.update!(status: "executed", execution_payload: { entity_ref: ref, action: action }, target_entity_ref: ref)
          { entity_ref: ref, action: action }
        when "curriculum_document"
          context = resolve_or_create_planning_context!(payload)
          document = CurriculumDocument.find_by(
            tenant_id: batch.tenant_id,
            school_id: batch.school_id,
            title: payload["title"],
          )
          action = document.present? ? "update" : "create"
          document ||= Curriculum::DocumentFactory.create!(
            planning_context: context,
            document_type: payload["document_type"],
            title: payload["title"],
            created_by: actor,
            schema_key: payload["schema_key"],
            initial_content: payload["content"].is_a?(Hash) ? payload["content"] : {},
          )
          document.update!(status: "draft") if batch.import_mode == "draft" && document.status != "draft"
          if action == "update"
            document.create_version!(
              title: payload["title"],
              content: payload["content"].is_a?(Hash) ? payload["content"] : {},
              created_by: actor,
            )
          end
          ref = "CurriculumDocument:#{document.id}"
          row.update!(status: "executed", execution_payload: { entity_ref: ref, action: action }, target_entity_ref: ref)
          { entity_ref: ref, action: action }
        when "operational_record"
          record = IbOperationalRecord.find_or_initialize_by(
            tenant_id: batch.tenant_id,
            school_id: batch.school_id,
            title: payload["title"],
          )
          action = record.persisted? ? "update" : "create"
          record.assign_attributes(
            planning_context_id: nil,
            curriculum_document_id: nil,
            programme: payload["programme"] || batch.programme,
            record_family: payload["record_family"] || "misc",
            subtype: payload["subtype"] || "item",
            status: payload["status"] || record.status || "draft",
            priority: payload["priority"] || record.priority || "normal",
            risk_level: payload["risk_level"] || record.risk_level || "healthy",
            summary: payload["summary"],
            next_action: payload["next_action"],
            route_hint: payload["route_hint"],
            owner_id: record.owner_id || actor.id,
            metadata: (record.metadata || {}).merge(
              "import_batch_id" => batch.id,
              "import_actor_id" => actor.id,
              "source_system" => batch.source_system,
              "coexistence_mode" => batch.coexistence_mode,
              "draft_import" => batch.import_mode == "draft"
            ),
          )
          record.status = "draft" if batch.import_mode == "draft"
          record.save!
          ref = "IbOperationalRecord:#{record.id}"
          row.update!(status: "executed", execution_payload: { entity_ref: ref, action: action }, target_entity_ref: ref)
          { entity_ref: ref, action: action }
        else
          nil
        end
      end

      def resolve_or_create_planning_context!(payload)
        context_name = payload["planning_context_name"]
        context = PlanningContext.find_by(tenant_id: batch.tenant_id, school_id: batch.school_id, name: context_name)
        return context if context.present?

        academic_year = batch.academic_year || AcademicYear.where(tenant_id: batch.tenant_id).order(:start_date).last
        Curriculum::PlanningContextFactory.create!(
          tenant: batch.tenant,
          created_by: actor,
          school: batch.school,
          academic_year: academic_year,
          kind: "programme_scope",
          name: context_name,
          course_ids: [],
          settings: { "import_batch_id" => batch.id },
        )
      end

      def destroy_ref(ref)
        type, id = ref.to_s.split(":", 2)
        return false if type.blank? || id.blank?

        case type
        when "PypProgrammeOfInquiryEntry"
          PypProgrammeOfInquiryEntry.find_by(id: id)&.destroy!
        when "CurriculumDocument"
          document = CurriculumDocument.find_by(id: id)
          return false unless document

          # Avoid foreign-key deadlocks when the document still points at its current version.
          document.update_column(:current_version_id, nil) if document.current_version_id.present? # rubocop:disable Rails/SkipsModelValidations
          document.destroy!
        when "IbOperationalRecord"
          record = IbOperationalRecord.find_by(id: id)
          return false unless record

          record.destroy!
        else
          return false
        end
        true
      rescue StandardError
        false
      end
    end
  end
end
