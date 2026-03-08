module Api
  module V1
    module Ib
      class ImportBatchesController < BaseController
        before_action :set_batch, only: [ :show, :update, :dry_run, :execute, :rollback ]

        def index
          authorize IbImportBatch
          render json: policy_scope(IbImportBatch).includes(:rows).order(updated_at: :desc).map { |batch| serialize_batch(batch) }
        end

        def show
          authorize @batch
          render json: serialize_batch(@batch)
        end

        def create
          authorize IbImportBatch
          academic_year = AcademicYear.find_by(id: batch_params[:academic_year_id]) if batch_params[:academic_year_id].present?
          batch = import_service.create!(
            source_kind: batch_params.fetch(:source_kind),
            source_format: batch_params.fetch(:source_format),
            source_filename: batch_params.fetch(:source_filename),
            raw_payload: batch_params.fetch(:raw_payload),
            academic_year: academic_year,
            programme: batch_params[:programme].presence || "Mixed",
            mapping_payload: batch_params[:mapping_payload] || {},
            source_system: batch_params[:source_system].presence || "generic",
            import_mode: batch_params[:import_mode].presence || "draft",
            coexistence_mode: ActiveModel::Type::Boolean.new.cast(batch_params[:coexistence_mode]),
          )
          audit_event(
            "ib.import.batch.created",
            auditable: batch,
            metadata: {
              source_kind: batch.source_kind,
              source_system: batch.source_system,
              source_format: batch.source_format,
              import_mode: batch.import_mode
            }
          )
          render json: serialize_batch(batch), status: :created
        end

        def update
          authorize @batch
          import_service.update_mapping!(batch: @batch, mapping_payload: batch_params[:mapping_payload] || {})
          audit_event("ib.import.batch.mapping_updated", auditable: @batch, metadata: { mapping_keys: @batch.mapping_payload.keys.sort })
          render json: serialize_batch(@batch.reload)
        end

        def dry_run
          authorize @batch
          import_service.dry_run!(batch: @batch)
          audit_event("ib.import.batch.dry_run", auditable: @batch, metadata: { blocked: @batch.dry_run_summary["blocked"] || 0 })
          render json: serialize_batch(@batch.reload)
        end

        def execute
          authorize @batch
          import_service.execute!(batch: @batch, async: ActiveModel::Type::Boolean.new.cast(params[:async]))
          audit_event("ib.import.batch.execute", auditable: @batch, metadata: { status: @batch.reload.status })
          render json: serialize_batch(@batch.reload)
        end

        def rollback
          authorize @batch
          import_service.rollback!(batch: @batch)
          audit_event("ib.import.batch.rollback", auditable: @batch, metadata: { rolled_back_at: @batch.reload.rolled_back_at&.utc&.iso8601 })
          render json: serialize_batch(@batch.reload)
        end

        private

        def import_service
          @import_service ||= ::Ib::Migration::ImportBatchService.new(
            tenant: Current.tenant,
            school: current_school_scope || School.where(tenant_id: Current.tenant.id).first!,
            actor: Current.user,
          )
        end

        def set_batch
          @batch = policy_scope(IbImportBatch).find(params[:id])
        end

        def batch_params
          params.require(:ib_import_batch).permit(
            :programme,
            :source_kind,
            :source_format,
            :source_filename,
            :raw_payload,
            :academic_year_id,
            :source_system,
            :import_mode,
            :coexistence_mode,
            mapping_payload: {}
          )
        end

        def serialize_batch(batch)
          {
            id: batch.id,
            programme: batch.programme,
            status: batch.status,
          source_kind: batch.source_kind,
          source_format: batch.source_format,
          source_system: batch.source_system,
          import_mode: batch.import_mode,
          coexistence_mode: batch.coexistence_mode,
          source_contract_version: batch.source_contract_version,
          source_filename: batch.source_filename,
          source_checksum: batch.source_checksum,
          scope_metadata: batch.scope_metadata,
          parser_warnings: batch.parser_warnings,
          mapping_payload: batch.mapping_payload,
          validation_summary: batch.validation_summary,
          preview_summary: batch.preview_summary,
          dry_run_summary: batch.dry_run_summary,
          execution_summary: batch.execution_summary,
          rollback_summary: batch.rollback_summary,
          rollback_capabilities: batch.rollback_capabilities,
          recovery_payload: batch.recovery_payload,
          resume_cursor: batch.resume_cursor,
          last_enqueued_job_id: batch.last_enqueued_job_id,
          error_message: batch.error_message,
          preview_generated_at: batch.preview_generated_at&.utc&.iso8601,
          last_dry_run_at: batch.last_dry_run_at&.utc&.iso8601,
          executed_at: batch.executed_at&.utc&.iso8601,
          rows: batch.rows.order(:row_index).map do |row|
              {
                id: row.id,
                row_index: row.row_index,
                sheet_name: row.sheet_name,
                source_identifier: row.source_identifier,
                status: row.status,
                source_payload: row.source_payload,
                normalized_payload: row.normalized_payload,
                mapping_payload: row.mapping_payload,
                warnings: row.warnings,
                errors: row.error_messages,
                conflict_payload: row.conflict_payload,
                resolution_payload: row.resolution_payload,
                execution_payload: row.execution_payload,
                target_entity_ref: row.target_entity_ref,
                entity_kind: row.entity_kind,
                data_loss_risk: row.data_loss_risk,
                duplicate_candidate_ref: row.duplicate_candidate_ref,
                unsupported_fields: row.unsupported_fields
              }
            end,
            created_at: batch.created_at.utc.iso8601,
            updated_at: batch.updated_at.utc.iso8601
          }
        end
      end
    end
  end
end
