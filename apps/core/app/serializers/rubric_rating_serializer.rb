class RubricRatingSerializer < ActiveModel::Serializer
  attributes :id, :rubric_criterion_id, :description, :points, :position, :created_at, :updated_at
end
