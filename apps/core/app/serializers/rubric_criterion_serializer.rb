class RubricCriterionSerializer < ActiveModel::Serializer
  attributes :id, :rubric_id, :title, :description, :points, :position, :created_at, :updated_at

  has_many :rubric_ratings
end
