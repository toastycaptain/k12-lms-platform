module Api
  module V1
    class CurriculumDocumentsController < ApplicationController
      before_action :ensure_curriculum_documents_enabled!
      before_action :set_curriculum_document, only: [ :show, :update, :destroy, :transition ]

      def index
        documents = policy_scope(CurriculumDocument).includes(:current_version).order(updated_at: :desc)
        documents = documents.where(planning_context_id: params[:planning_context_id]) if params[:planning_context_id].present?
        documents = documents.where(document_type: params[:document_type]) if params[:document_type].present?
        documents = documents.where(status: params[:status]) if params[:status].present?
        documents = documents.where(school_id: params[:school_id]) if params[:school_id].present?
        documents = documents.where(academic_year_id: params[:academic_year_id]) if params[:academic_year_id].present?
        documents = documents.where("title ILIKE ?", "%#{params[:q].to_s.strip}%") if params[:q].present?
        render json: paginate(documents)
      end

      def show
        authorize @curriculum_document
        render json: @curriculum_document
      end

      def create
        authorize CurriculumDocument
        planning_context = policy_scope(PlanningContext).find(document_params.fetch(:planning_context_id))
        if Current.respond_to?(:school) && Current.school.present? && planning_context.school_id != Current.school.id
          render json: { error: "School mismatch" }, status: :unprocessable_content
          return
        end
        document = Curriculum::DocumentFactory.create!(
          planning_context: planning_context,
          document_type: document_params.fetch(:document_type),
          title: document_params.fetch(:title),
          created_by: Current.user,
          schema_key: document_params[:schema_key],
          initial_content: document_params[:content] || {}
        )
        render json: document, status: :created
      rescue Curriculum::DocumentFactory::FactoryError => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      rescue Curriculum::JsonSchemaValidator::ValidationError => e
        render json: { error: "schema_validation_failed", details: e.errors }, status: :unprocessable_content
      end

      def update
        authorize @curriculum_document
        if @curriculum_document.update(document_update_params)
          render json: @curriculum_document
        else
          render json: { errors: @curriculum_document.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @curriculum_document
        @curriculum_document.destroy!
        head :no_content
      end

      def transition
        authorize @curriculum_document, :transition?
        event = params[:event].to_s
        if event.blank?
          render json: { errors: [ "event is required" ] }, status: :unprocessable_content
          return
        end

        Curriculum::WorkflowEngine.transition!(
          record: @curriculum_document,
          event: event,
          actor: Current.user,
          context: { approval_required: Current.tenant&.settings&.dig("approval_required") == true }
        )
        render json: @curriculum_document
      rescue Curriculum::WorkflowEngine::TransitionError => e
        render json: { errors: [ e.message ] }, status: :unprocessable_content
      end

      private

      def set_curriculum_document
        @curriculum_document = policy_scope(CurriculumDocument).find(params[:id])
      end

      def document_params
        params.require(:curriculum_document).permit(
          :planning_context_id,
          :document_type,
          :title,
          :schema_key,
          content: {}
        )
      end

      def document_update_params
        params.require(:curriculum_document).permit(:title, :status, settings: {}, metadata: {})
      end

      def ensure_curriculum_documents_enabled!
        return if FeatureFlag.enabled?("curriculum_documents_v1", tenant: Current.tenant)

        render json: { error: "Not found" }, status: :not_found
      end
    end
  end
end
