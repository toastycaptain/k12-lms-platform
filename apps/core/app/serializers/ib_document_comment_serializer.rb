class IbDocumentCommentSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :curriculum_document_id, :author_id, :parent_comment_id, :resolved_by_id,
    :comment_type, :status, :visibility, :anchor_path, :body, :resolved_at, :metadata, :created_at, :updated_at
end
