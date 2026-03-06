class CurriculumDocumentLinkSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :source_document_id, :target_document_id, :relationship_type, :position, :metadata, :created_at, :updated_at, :target_document

  def target_document
    document = object.target_document
    return nil if document.nil?

    {
      id: document.id,
      title: document.title,
      document_type: document.document_type,
      schema_key: document.schema_key,
      status: document.status
    }
  end
end
