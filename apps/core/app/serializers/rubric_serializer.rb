class RubricSerializer < ActiveModel::Serializer
  attributes :id, :created_by_id, :title, :description, :points_possible, :created_at, :updated_at

  has_many :rubric_criteria
end
