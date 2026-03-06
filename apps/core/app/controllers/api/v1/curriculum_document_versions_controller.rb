module Api
  module V1
    class CurriculumDocumentVersionsController < ApplicationController
      before_action :ensure_curriculum_documents_enabled!
      before_action :set_curriculum_document

      def index
        authorize @curriculum_document, :show?
        versions = policy_scope(CurriculumDocumentVersion)
          .where(curriculum_document_id: @curriculum_document.id)
          .order(version_number: :desc)
        render json: versions
      end

      def create
        authorize @curriculum_document, :update?
        version = @curriculum_document.create_version!(
          title: version_params[:title].presence || @curriculum_document.title,
          content: version_params[:content] || {},
          created_by: Current.user
        )
        render json: version, status: :created
      rescue Curriculum::JsonSchemaValidator::ValidationError => e
        render json: { error: "schema_validation_failed", details: e.errors }, status: :unprocessable_content
      rescue Curriculum::PackSchemaResolver::SchemaResolutionError => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      rescue ArgumentError => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      end

      private

      def set_curriculum_document
        @curriculum_document = policy_scope(CurriculumDocument).find(params[:curriculum_document_id])
      end

      def version_params
        params.require(:version).permit(:title, content: {})
      end

      def ensure_curriculum_documents_enabled!
        return if FeatureFlag.enabled?("curriculum_documents_v1", tenant: Current.tenant)

        render json: { error: "Not found" }, status: :not_found
      end
    end
  end
end
