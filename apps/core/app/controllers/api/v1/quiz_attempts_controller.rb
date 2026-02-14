module Api
  module V1
    class QuizAttemptsController < ApplicationController
      before_action :set_quiz, only: [ :index, :create ]
      before_action :set_quiz_attempt, only: [ :show, :submit, :grade_all ]

      def index
        attempts = policy_scope(QuizAttempt).where(quiz: @quiz).includes(:quiz)
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

      def grade_all
        authorize @quiz_attempt, :show?

        grades = params[:grades] || []
        answer_ids = grades.map { |g| g[:attempt_answer_id] }
        answers_by_id = @quiz_attempt.attempt_answers.where(id: answer_ids).index_by(&:id)

        grades.each do |g|
          answer = answers_by_id[g[:attempt_answer_id].to_i] || answers_by_id[g[:attempt_answer_id]]
          raise ActiveRecord::RecordNotFound, "Couldn't find AttemptAnswer with id=#{g[:attempt_answer_id]}" unless answer

          authorize answer, :grade?
          answer.update!(
            points_awarded: g[:points_awarded],
            feedback: g[:feedback],
            graded_at: Time.current,
            graded_by: Current.user
          )
        end

        @quiz_attempt.calculate_score!
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
