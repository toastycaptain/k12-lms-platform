module Api
  module V1
    module Ib
      class DocumentCollaboratorsController < BaseController
        before_action :set_curriculum_document

        def index
          authorize @curriculum_document, :show?, policy_class: CurriculumDocumentPolicy
          collaborators = policy_scope(IbDocumentCollaborator).where(curriculum_document_id: @curriculum_document.id)
          render json: collaborators
        end

        def create
          authorize @curriculum_document, :update?, policy_class: CurriculumDocumentPolicy
          collaborator = IbDocumentCollaborator.create!(collaborator_params.merge(
            tenant: Current.tenant,
            curriculum_document: @curriculum_document,
            assigned_by: Current.user
          ))
          render json: collaborator, status: :created
        end

        def update
          collaborator = policy_scope(IbDocumentCollaborator).find(params[:id])
          authorize collaborator
          collaborator.update!(collaborator_update_params)
          render json: collaborator
        end

        private

        def set_curriculum_document
          @curriculum_document = policy_scope(CurriculumDocument).find(params[:curriculum_document_id])
        end

        def collaborator_params
          params.require(:ib_document_collaborator).permit(:user_id, :role, :status, :contribution_mode, metadata: {})
        end

        def collaborator_update_params
          params.require(:ib_document_collaborator).permit(:role, :status, :contribution_mode, metadata: {})
        end
      end
    end
  end
end
