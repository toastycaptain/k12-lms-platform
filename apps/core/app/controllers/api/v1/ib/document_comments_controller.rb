module Api
  module V1
    module Ib
      class DocumentCommentsController < BaseController
        before_action :set_curriculum_document

        def index
          authorize @curriculum_document, :show?, policy_class: CurriculumDocumentPolicy
          comments = policy_scope(IbDocumentComment).where(curriculum_document_id: @curriculum_document.id).order(created_at: :asc)
          render json: comments
        end

        def create
          authorize @curriculum_document, :show?, policy_class: CurriculumDocumentPolicy
          comment = IbDocumentComment.create!(comment_params.merge(
            tenant: Current.tenant,
            curriculum_document: @curriculum_document,
            author: Current.user
          ))
          render json: comment, status: :created
        end

        def update
          comment = policy_scope(IbDocumentComment).find(params[:id])
          authorize comment
          if params[:ib_document_comment][:status].to_s == "resolved"
            comment.resolve!(actor: Current.user)
          else
            comment.update!(comment_update_params)
          end
          render json: comment
        end

        private

        def set_curriculum_document
          @curriculum_document = policy_scope(CurriculumDocument).find(params[:curriculum_document_id])
        end

        def comment_params
          params.require(:ib_document_comment).permit(:comment_type, :visibility, :anchor_path, :body, :parent_comment_id, metadata: {})
        end

        def comment_update_params
          params.require(:ib_document_comment).permit(:status, :body, metadata: {})
        end
      end
    end
  end
end
