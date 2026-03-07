class IbPortfolioCollectionSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :student_id, :created_by_id, :title, :narrative_summary,
    :visibility, :shared_token, :filters, :item_refs, :metadata, :created_at, :updated_at
end
