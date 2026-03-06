class IbStandardsPacketSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :ib_standards_cycle_id, :owner_id, :code, :title,
    :review_state, :reviewer_id, :evidence_strength, :export_status, :metadata, :created_at, :updated_at,
    :items, :score_summary, :export_history, :entity_ref, :route_id, :href, :fallback_route_id

  def items
    ActiveModelSerializers::SerializableResource.new(object.items).as_json
  end

  def score_summary
    object.score_summary
  end

  def export_history
    ActiveModelSerializers::SerializableResource.new(object.exports.order(created_at: :desc)).as_json
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
end
