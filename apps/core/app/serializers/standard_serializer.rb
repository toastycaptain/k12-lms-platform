class StandardSerializer < ActiveModel::Serializer
  attributes :id, :code, :identifier, :label, :kind, :metadata, :description, :grade_band, :standard_framework_id,
             :parent_id, :search_rank, :created_at, :updated_at

  def search_rank
    rank = object.attributes["search_rank"]
    rank.nil? ? nil : rank.to_f
  end
end
