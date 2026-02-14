module Api
  module V1
    class AttemptAnswerGradingController < ApplicationController
      def grade
        @answer = AttemptAnswer.find(params[:id])
        authorize @answer, :grade?

        points_awarded = params[:points_awarded].to_d
        quiz_item = QuizItem.find_by!(quiz_id: @answer.quiz_attempt.quiz_id, question_id: @answer.question_id)

        if points_awarded < 0 || points_awarded > quiz_item.points
          render json: { error: "points_awarded must be between 0 and #{quiz_item.points}" }, status: :unprocessable_entity
          return
        end

        @answer.update!(
          points_awarded: points_awarded,
          feedback: params[:feedback],
          is_correct: params[:is_correct],
          graded_at: Time.current,
          graded_by: Current.user
        )

        @answer.quiz_attempt.calculate_score!
        audit_event(
          "attempt_answer.graded",
          auditable: @answer,
          metadata: {
            quiz_attempt_id: @answer.quiz_attempt_id,
            question_id: @answer.question_id,
            points_awarded: points_awarded.to_s
          }
        )
        render json: @answer
      end
    end
  end
end
