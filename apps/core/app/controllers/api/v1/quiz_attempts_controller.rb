module Api
  module V1
    class QuizAttemptsController < ApplicationController
      before_action :set_quiz, only: [ :index, :create ]
      before_action :set_quiz_attempt, only: [ :show, :submit ]

      def index
        attempts = policy_scope(QuizAttempt).where(quiz: @quiz)
        render json: attempts
      end

      def create
        attempt_number = QuizAttempt.where(quiz_id: @quiz.id, user_id: Current.user.id).count + 1
        @quiz_attempt = @quiz.quiz_attempts.build(
          tenant: Current.tenant,
          user: Current.user,
          attempt_number: attempt_number,
          started_at: Time.current
        )
        authorize @quiz_attempt
        if @quiz_attempt.save
          render json: @quiz_attempt, status: :created
        else
          render json: { errors: @quiz_attempt.errors.full_messages }, status: :unprocessable_content
        end
      end

      def show
        authorize @quiz_attempt
        render json: @quiz_attempt
      end

      def submit
        authorize @quiz_attempt
        @quiz_attempt.submit!
        render json: @quiz_attempt
      end

      private

      def set_quiz
        @quiz = Quiz.find(params[:quiz_id])
      end

      def set_quiz_attempt
        @quiz_attempt = QuizAttempt.find(params[:id])
      end
    end
  end
end
