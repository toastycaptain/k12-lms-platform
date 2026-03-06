class CurriculumDocumentVersionSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :curriculum_document_id, :version_number, :title, :content, :created_by_id,
    :created_at, :updated_at, :pack_key, :pack_version, :schema_key, :workflow_key, :migration_status

  def pack_key
    object.curriculum_document&.pack_key
  end

  def pack_version
    object.curriculum_document&.pack_version
  end

  def schema_key
    object.curriculum_document&.schema_key
  end

  def workflow_key
    CurriculumDocumentSerializer.new(object.curriculum_document).workflow_key
  end

  def migration_status
    CurriculumDocumentSerializer.new(object.curriculum_document).migration_status
  end
end
