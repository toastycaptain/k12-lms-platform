class RubricScoreSerializer < ActiveModel::Serializer
  attributes :id, :submission_id, :rubric_criterion_id, :rubric_rating_id,
    :points_awarded, :comments, :created_at, :updated_at
end
