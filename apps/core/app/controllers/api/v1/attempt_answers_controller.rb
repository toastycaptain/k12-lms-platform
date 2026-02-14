module Api
  module V1
    class AttemptAnswersController < ApplicationController
      before_action :set_quiz_attempt

      def index
        answers = policy_scope(AttemptAnswer).where(quiz_attempt: @quiz_attempt)
        render json: answers
      end

      def create
        unless @quiz_attempt.user == Current.user
          render json: { error: "Forbidden" }, status: :forbidden
          return
        end
        authorize @quiz_attempt, :show?

        unless @quiz_attempt.status == "in_progress"
          render json: { errors: [ "Attempt is not in progress" ] }, status: :unprocessable_content
          return
        end

        answers_params = params[:answers] || []
        saved_answers = []

        answers_params.each do |ap|
          answer = @quiz_attempt.attempt_answers.find_or_initialize_by(question_id: ap[:question_id])
          answer.tenant = Current.tenant
          answer.answer = ap[:answer]
          answer.save!
          saved_answers << answer
        end

        render json: saved_answers, status: :created
      end

      private

      def set_quiz_attempt
        @quiz_attempt = QuizAttempt.find(params[:quiz_attempt_id])
      end
    end
  end
end
