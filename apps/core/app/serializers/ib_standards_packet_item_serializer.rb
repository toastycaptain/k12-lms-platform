class IbStandardsPacketItemSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :ib_standards_packet_id, :source_type, :source_id, :review_state,
    :summary, :relevance_note, :metadata, :created_at, :updated_at, :provenance_href

  def provenance_href
    source = object.source_type.safe_constantize&.unscoped&.find_by(id: object.source_id)
    return nil if source.nil?

    ::Ib::RouteBuilder.href_for(source)
  end
end
