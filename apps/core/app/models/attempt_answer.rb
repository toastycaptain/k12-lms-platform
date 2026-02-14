class AttemptAnswer < ApplicationRecord
  include TenantScoped

  belongs_to :quiz_attempt
  belongs_to :question
  belongs_to :graded_by, class_name: "User", optional: true

  validates :question_id, uniqueness: { scope: :quiz_attempt_id }

  def auto_grade!
    return unless question.auto_gradable?

    correct = check_answer
    quiz_item = QuizItem.find_by(quiz_id: quiz_attempt.quiz_id, question_id: question_id)
    awarded = correct ? quiz_item&.points.to_d : 0

    update!(
      is_correct: correct,
      points_awarded: awarded,
      graded_at: Time.current
    )
  end

  private

  def check_answer
    case question.question_type
    when "multiple_choice"
      answer["key"] == question.correct_answer["key"]
    when "true_false"
      answer["value"] == question.correct_answer["value"]
    when "short_answer"
      acceptable = Array(question.correct_answer["acceptable"]).map(&:downcase)
      acceptable.include?(answer["text"].to_s.strip.downcase)
    when "matching"
      normalize_pairs(answer["pairs"]) == normalize_pairs(question.correct_answer["pairs"])
    when "fill_in_blank"
      Array(answer["answers"]).map(&:downcase) == Array(question.correct_answer["answers"]).map(&:downcase)
    else
      false
    end
  end

  def normalize_pairs(pairs)
    Array(pairs).map { |p| [ p["left"].to_s.downcase, p["right"].to_s.downcase ] }.to_set
  end
end
