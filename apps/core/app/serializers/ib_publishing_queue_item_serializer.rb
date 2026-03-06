class IbPublishingQueueItemSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :ib_learning_story_id, :created_by_id, :state, :scheduled_for,
    :delivered_at, :held_reason, :metadata, :created_at, :updated_at, :entity_ref, :route_id, :href,
    :fallback_route_id, :changed_since_last_seen

  attribute :story

  def story
    ActiveModelSerializers::SerializableResource.new(object.ib_learning_story).as_json
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
