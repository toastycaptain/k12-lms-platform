module Api
  module V1
    module Ib
      class CollaborationWorkbenchController < BaseController
        def show
          authorize IbCollaborationTask
          render json: service.build(curriculum_document_id: params[:curriculum_document_id])
        end

        private

        def service
          @service ||= ::Ib::Collaboration::WorkbenchService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end
      end
    end
  end
end
