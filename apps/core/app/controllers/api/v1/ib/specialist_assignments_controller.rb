module Api
  module V1
    module Ib
      class SpecialistAssignmentsController < BaseController
        def index
          authorize IbDocumentCollaborator
          render json: ::Ib::Specialist::AssignmentService.new(user: Current.user, school: current_school_scope).build
        end

        def create
          document = policy_scope(CurriculumDocument).find(assignment_params.fetch(:curriculum_document_id))
          assigned_user = policy_scope(User).find(assignment_params.fetch(:user_id))
          collaborator = ::Ib::Specialist::AssignmentService.new(user: Current.user, school: current_school_scope).upsert_assignment!(
            document: document,
            assigned_user: assigned_user,
            role: assignment_params.fetch(:role),
            contribution_mode: assignment_params.fetch(:contribution_mode),
            detail: assignment_params[:detail]
          )
          authorize collaborator
          render json: collaborator, status: :created
        end

        private

        def assignment_params
          params.require(:ib_specialist_assignment).permit(:curriculum_document_id, :user_id, :role, :contribution_mode, :detail)
        end
      end
    end
  end
end
