class RubricScore < ApplicationRecord
  include TenantScoped

  belongs_to :submission
  belongs_to :rubric_criterion
  belongs_to :rubric_rating, optional: true

  validates :points_awarded, presence: true
  validates :rubric_criterion_id, uniqueness: { scope: :submission_id }
end
