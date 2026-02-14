module Api
  module V1
    class AttemptAnswerGradingController < ApplicationController
      def grade
        @answer = AttemptAnswer.find(params[:id])
        authorize @answer, :grade?

        @answer.update!(
          points_awarded: params[:points_awarded],
          feedback: params[:feedback],
          is_correct: params[:is_correct],
          graded_at: Time.current,
          graded_by: Current.user
        )

        @answer.quiz_attempt.calculate_score!
        render json: @answer
      end
    end
  end
end
