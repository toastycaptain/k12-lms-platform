class IbSpecialistLibraryItemSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :created_by_id, :programme, :item_type, :title,
    :summary, :content, :tags, :source_entity_ref, :metadata, :created_at, :updated_at
end
