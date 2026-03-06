class IbStandardsCycleSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :academic_year_id, :coordinator_id, :title, :status,
    :metadata, :created_at, :updated_at, :packets, :export_count, :entity_ref, :route_id, :href,
    :fallback_route_id

  def packets
    ActiveModelSerializers::SerializableResource.new(object.packets).as_json
  end

  def export_count
    object.exports.count
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
