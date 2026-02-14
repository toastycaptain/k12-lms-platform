class QuizItem < ApplicationRecord
  include TenantScoped

  belongs_to :quiz
  belongs_to :question

  validates :points, numericality: { greater_than: 0 }
  validates :question_id, uniqueness: { scope: :quiz_id, message: "is already in this quiz" }

  after_save :recalculate_quiz_points
  after_destroy :recalculate_quiz_points

  private

  def recalculate_quiz_points
    quiz.calculate_points!
  end
end
