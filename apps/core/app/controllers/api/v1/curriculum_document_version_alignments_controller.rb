module Api
  module V1
    class CurriculumDocumentVersionAlignmentsController < ApplicationController
      before_action :ensure_curriculum_documents_enabled!
      before_action :ensure_generic_frameworks_enabled!
      before_action :set_curriculum_document_version

      def index
        authorize @curriculum_document_version, :index?, policy_class: CurriculumDocumentVersionAlignmentPolicy

        alignments = policy_scope(CurriculumDocumentVersionAlignment)
          .includes(:standard)
          .where(curriculum_document_version_id: @curriculum_document_version.id)
          .order(:id)

        render json: alignments
      end

      def create
        authorize @curriculum_document_version, :create?, policy_class: CurriculumDocumentVersionAlignmentPolicy

        standard = policy_scope(Standard).find(alignment_params.fetch(:standard_id))
        alignment = CurriculumDocumentVersionAlignment.find_or_initialize_by(
          tenant: Current.tenant,
          curriculum_document_version: @curriculum_document_version,
          standard: standard,
          alignment_type: alignment_params[:alignment_type].presence || "aligned"
        )
        alignment.metadata = alignment_params[:metadata] || {}
        alignment.save!

        render json: alignment, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      def bulk_destroy
        authorize @curriculum_document_version, :bulk_destroy?, policy_class: CurriculumDocumentVersionAlignmentPolicy

        standard_ids = Array(params[:standard_ids]).map(&:to_i).uniq
        alignment_type = params[:alignment_type].to_s.presence

        scope = policy_scope(CurriculumDocumentVersionAlignment).where(curriculum_document_version_id: @curriculum_document_version.id)
        scope = scope.where(standard_id: standard_ids) if standard_ids.present?
        scope = scope.where(alignment_type: alignment_type) if alignment_type.present?

        deleted_count = scope.delete_all
        render json: { deleted: deleted_count }
      end

      private

      def set_curriculum_document_version
        @curriculum_document_version = policy_scope(CurriculumDocumentVersion).find(params[:curriculum_document_version_id])
      end

      def alignment_params
        params.require(:alignment).permit(:standard_id, :alignment_type, metadata: {})
      end

      def ensure_curriculum_documents_enabled!
        return if FeatureFlag.enabled?("curriculum_documents_v1", tenant: Current.tenant)

        render json: { error: "Not found" }, status: :not_found
      end

      def ensure_generic_frameworks_enabled!
        return if FeatureFlag.enabled?("generic_frameworks_v1", tenant: Current.tenant)

        render json: { error: "Not found" }, status: :not_found
      end
    end
  end
end
