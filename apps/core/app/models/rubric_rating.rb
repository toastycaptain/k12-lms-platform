class RubricRating < ApplicationRecord
  include TenantScoped

  belongs_to :rubric_criterion

  validates :description, presence: true
  validates :points, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(:position) }
end
