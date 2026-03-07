module Api
  module V1
    module Ib
      class CollaborationSessionsController < BaseController
        before_action :set_document

        def index
          authorize IbCollaborationSession
          render json: session_service.list
        end

        def create
          authorize IbCollaborationSession
          render json: session_service.sync!(
            session_key: collaboration_params.fetch(:session_key),
            scope_type: collaboration_params[:scope_type] || "document",
            scope_key: collaboration_params[:scope_key] || "root",
            role: collaboration_params[:role] || "editor",
            device_label: collaboration_params[:device_label],
            status: collaboration_params[:status] || "active",
            metadata: collaboration_params[:metadata] || {}
          ), status: :created
        end

        def update
          authorize IbCollaborationSession
          render json: session_service.sync!(
            session_key: collaboration_params.fetch(:session_key),
            scope_type: collaboration_params[:scope_type] || "document",
            scope_key: collaboration_params[:scope_key] || "root",
            role: collaboration_params[:role] || "editor",
            device_label: collaboration_params[:device_label],
            status: collaboration_params[:status] || "active",
            metadata: collaboration_params[:metadata] || {}
          )
        end

        private

        def set_document
          @document = policy_scope(CurriculumDocument).find(params.fetch(:curriculum_document_id))
          authorize @document, :show?, policy_class: CurriculumDocumentPolicy
        end

        def session_service
          @session_service ||= ::Ib::Collaboration::SessionService.new(
            document: @document,
            user: Current.user,
            school: current_school_scope
          )
        end

        def collaboration_params
          params.fetch(:ib_collaboration_session, params).permit(
            :session_key,
            :scope_type,
            :scope_key,
            :role,
            :device_label,
            :status,
            metadata: {}
          )
        end
      end
    end
  end
end
