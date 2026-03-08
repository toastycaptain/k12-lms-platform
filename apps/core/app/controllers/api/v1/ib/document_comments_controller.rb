module Api
  module V1
    module Ib
      class DocumentCommentsController < BaseController
        before_action :set_curriculum_document, only: %i[index create]

        def index
          authorize @curriculum_document, :show?, policy_class: CurriculumDocumentPolicy
          comments = policy_scope(IbDocumentComment)
            .includes(:author, :resolved_by, replies: :author)
            .where(curriculum_document_id: @curriculum_document.id)
            .order(created_at: :asc)
          comments = comments.where(comment_type: params[:comment_type]) if params[:comment_type].present?
          comments = comments.where(status: params[:status]) if params[:status].present?
          comments = comments.where(parent_comment_id: params[:parent_comment_id]) if params[:parent_comment_id].present?
          render json: comments.map { |comment| serialize(comment) }
        end

        def create
          authorize @curriculum_document, :show?, policy_class: CurriculumDocumentPolicy
          comment = IbDocumentComment.create!(comment_params.merge(
            tenant: Current.tenant,
            curriculum_document: @curriculum_document,
            author: Current.user
          ))
          render json: serialize(comment.reload), status: :created
        end

        def update
          comment = IbDocumentComment.find(params[:id])
          authorize comment
          payload = params.fetch(:ib_document_comment, params)
          if payload[:status].to_s == "resolved"
            comment.resolve!(actor: Current.user)
          elsif payload[:status].to_s == "reopened"
            comment.update!(comment_update_params.merge(resolved_at: nil, resolved_by: nil))
          else
            comment.update!(comment_update_params)
          end
          render json: serialize(comment.reload)
        end

        private

        def set_curriculum_document
          @curriculum_document = policy_scope(CurriculumDocument).find(params[:curriculum_document_id])
        end

        def comment_params
          params.require(:ib_document_comment).permit(:comment_type, :visibility, :anchor_path, :body, :parent_comment_id, :status, metadata: {})
        end

        def comment_update_params
          params.require(:ib_document_comment).permit(:status, :body, metadata: {})
        end

        def serialize(comment)
          {
            id: comment.id,
            author_id: comment.author_id,
            author_label: comment.author&.full_name || comment.author&.email || "Unknown",
            comment_type: comment.comment_type,
            status: comment.status,
            visibility: comment.visibility,
            anchor_path: comment.anchor_path,
            body: comment.body,
            parent_comment_id: comment.parent_comment_id,
            resolved_at: comment.resolved_at&.utc&.iso8601,
            metadata: comment.metadata,
            created_at: comment.created_at.utc.iso8601,
            updated_at: comment.updated_at.utc.iso8601,
            reply_count: comment.replies.size,
            replies: comment.replies.sort_by(&:created_at).map do |reply|
              {
                id: reply.id,
                author_id: reply.author_id,
                author_label: reply.author&.full_name || reply.author&.email || "Unknown",
                comment_type: reply.comment_type,
                status: reply.status,
                visibility: reply.visibility,
                anchor_path: reply.anchor_path,
                body: reply.body,
                parent_comment_id: reply.parent_comment_id,
                resolved_at: reply.resolved_at&.utc&.iso8601,
                metadata: reply.metadata,
                created_at: reply.created_at.utc.iso8601,
                updated_at: reply.updated_at.utc.iso8601
              }
            end
          }
        end
      end
    end
  end
end
