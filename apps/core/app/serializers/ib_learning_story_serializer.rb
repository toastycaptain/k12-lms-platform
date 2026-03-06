class IbLearningStorySerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :planning_context_id, :curriculum_document_id, :created_by_id,
    :programme, :state, :cadence, :audience, :title, :summary, :support_prompt, :published_at,
    :metadata, :created_at, :updated_at, :blocks, :evidence_item_ids, :entity_ref, :route_id, :href,
    :fallback_route_id, :changed_since_last_seen

  def blocks
    ActiveModelSerializers::SerializableResource.new(object.blocks.order(:position)).as_json
  end

  def evidence_item_ids
    object.evidence_items.pluck(:id)
  end

  def entity_ref
    ::Ib::RouteBuilder.entity_ref_for(object)
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

  def changed_since_last_seen
    object.updated_at > 3.days.ago
  end
end
