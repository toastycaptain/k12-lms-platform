class CurriculumDocumentSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :academic_year_id, :planning_context_id, :document_type, :title, :status,
    :current_version_id, :created_by_id, :pack_key, :pack_version, :schema_key, :pack_payload_checksum,
    :settings, :metadata, :created_at, :updated_at, :workflow_key, :migration_status, :route_id,
    :href, :fallback_route_id

  attribute :current_version, if: :include_current_version?

  def current_version
    version = object.current_version
    return nil if version.nil?

    ActiveModelSerializers::SerializableResource.new(version).as_json
  end

  def include_current_version?
    object.association(:current_version).loaded? || scope&.dig(:include_current_version) == true
  end

  def workflow_key
    pack = CurriculumPackStore.fetch(
      tenant: object.tenant,
      key: object.pack_key,
      version: object.pack_version
    )
    return nil if pack.nil?

    Curriculum::WorkflowRegistry.workflow_for!(pack: pack, document_type: object.document_type)[:key]
  rescue Curriculum::WorkflowRegistry::WorkflowError
    nil
  end

  def migration_status
    return "needs_review" if object.schema_key.blank?
    return "deprecated_pack" if object.pack_key == "ib_continuum_v1" && object.pack_version != "2026.2"

    "current"
  end

  def route_id
    ::Ib::RouteBuilder.route_id_for(object)
  end

  def href
    ::Ib::RouteBuilder.href_for(object)
  end

  def fallback_route_id
    ::Ib::RouteBuilder.fallback_route_id_for(object)
  end
end
