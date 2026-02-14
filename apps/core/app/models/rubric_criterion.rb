class RubricCriterion < ApplicationRecord
  include TenantScoped

  belongs_to :rubric
  has_many :rubric_ratings, dependent: :destroy

  validates :title, presence: true
  validates :points, presence: true, numericality: { greater_than: 0 }

  scope :ordered, -> { order(:position) }
end
