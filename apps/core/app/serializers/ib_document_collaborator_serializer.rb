class IbDocumentCollaboratorSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :curriculum_document_id, :user_id, :assigned_by_id, :role, :status,
    :contribution_mode, :metadata, :created_at, :updated_at
end
