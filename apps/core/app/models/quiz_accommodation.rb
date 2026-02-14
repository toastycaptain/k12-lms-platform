class QuizAccommodation < ApplicationRecord
  include TenantScoped

  belongs_to :quiz
  belongs_to :user

  validates :user_id, uniqueness: { scope: :quiz_id }
  validates :extra_time_minutes, numericality: { greater_than_or_equal_to: 0 }
  validates :extra_attempts, numericality: { greater_than_or_equal_to: 0 }
end
