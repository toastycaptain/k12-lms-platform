module Api
  module V1
    class CurriculumDocumentLinksController < ApplicationController
      before_action :ensure_curriculum_documents_enabled!
      before_action :set_source_document, only: [ :index, :create ]
      before_action :set_curriculum_document_link, only: [ :destroy ]

      def index
        authorize @source_document, :show?, policy_class: CurriculumDocumentPolicy
        links = policy_scope(CurriculumDocumentLink)
          .where(source_document_id: @source_document.id)
          .order(:position, :id)
        render json: links
      end

      def create
        authorize @source_document, :update?, policy_class: CurriculumDocumentPolicy
        target_document = policy_scope(CurriculumDocument).find(link_params.fetch(:target_document_id))
        relationship_type = link_params.fetch(:relationship_type).to_s
        validate_relationship_constraints!(
          source_document: @source_document,
          target_document: target_document,
          relationship_type: relationship_type
        )

        link = CurriculumDocumentLink.create!(
          tenant: Current.tenant,
          source_document: @source_document,
          target_document: target_document,
          relationship_type: relationship_type,
          position: link_params[:position] || 0,
          metadata: link_params[:metadata] || {}
        )
        render json: link, status: :created
      rescue ArgumentError => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      def destroy
        authorize @curriculum_document_link
        @curriculum_document_link.destroy!
        head :no_content
      end

      private

      def set_source_document
        @source_document = policy_scope(CurriculumDocument).find(params[:curriculum_document_id])
      end

      def set_curriculum_document_link
        @curriculum_document_link = policy_scope(CurriculumDocumentLink).find(params[:id])
      end

      def link_params
        params.require(:link).permit(:target_document_id, :relationship_type, :position, metadata: {})
      end

      def validate_relationship_constraints!(source_document:, target_document:, relationship_type:)
        if source_document.tenant_id != target_document.tenant_id
          raise ArgumentError, "source and target documents must share tenant"
        end

        if relationship_type == "contains" && source_document.planning_context_id != target_document.planning_context_id
          raise ArgumentError, "contains links must remain within the same planning_context"
        end

        pack = CurriculumPackStore.fetch(
          tenant: source_document.tenant,
          key: source_document.pack_key,
          version: source_document.pack_version
        ) || {}
        relationship_rules = pack.dig("document_types", source_document.document_type, "relationships", relationship_type) || {}
        allowed_target_types = Array(relationship_rules["allowed_target_types"]).map(&:to_s)
        return if allowed_target_types.empty?
        return if allowed_target_types.include?(target_document.document_type.to_s)

        raise ArgumentError, "relationship #{relationship_type} is not allowed from #{source_document.document_type} to #{target_document.document_type}"
      end

      def ensure_curriculum_documents_enabled!
        return if FeatureFlag.enabled?("curriculum_documents_v1", tenant: Current.tenant)

        render json: { error: "Not found" }, status: :not_found
      end
    end
  end
end
