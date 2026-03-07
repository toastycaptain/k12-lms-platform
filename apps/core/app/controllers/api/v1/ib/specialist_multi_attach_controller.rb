module Api
  module V1
    module Ib
      class SpecialistMultiAttachController < BaseController
        def create
          authorize IbDocumentComment
          payload = ::Ib::Specialist::MultiAttachService.new(actor: Current.user).attach!(
            body: attach_params.fetch(:body),
            target_document_ids: Array(attach_params.fetch(:target_document_ids)),
            comment_type: attach_params[:comment_type] || "support_note",
            metadata: attach_params[:metadata] || {}
          )
          render json: payload, status: :created
        end

        private

        def attach_params
          params.require(:ib_specialist_multi_attach).permit(:body, :comment_type, target_document_ids: [], metadata: {})
        end
      end
    end
  end
end
