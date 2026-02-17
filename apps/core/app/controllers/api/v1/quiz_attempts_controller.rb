module Api
  module V1
    class QuizAttemptsController < ApplicationController
      before_action :set_quiz, only: [ :index, :create ]
      before_action :set_quiz_attempt, only: [ :show, :submit, :grade_all ]

      def index
        attempts = policy_scope(QuizAttempt).where(quiz: @quiz).includes(:attempt_answers)
        attempts = paginate(attempts)
        render json: attempts
      end

      def create
        QuizAttempt.transaction do
          # Lock existing attempts for this quiz/user to keep attempt numbering monotonic.
          existing_attempt_numbers = QuizAttempt.where(quiz_id: @quiz.id, user_id: Current.user.id)
                                                .lock("FOR UPDATE")
                                                .order(:attempt_number)
                                                .pluck(:attempt_number)
          attempt_number = existing_attempt_numbers.last.to_i + 1
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
      end

      def show
        authorize @quiz_attempt
        render json: @quiz_attempt
      end

      def submit
        authorize @quiz_attempt
        @quiz_attempt.submit!
        notify_quiz_graded!(@quiz_attempt)
        render json: @quiz_attempt
      end

      def grade_all
        authorize @quiz_attempt, :grade_all?

        grades = params[:grades] || []
        grades.each do |g|
          answer = @quiz_attempt.attempt_answers.find(g[:attempt_answer_id])
          authorize answer, :grade?
          answer.update!(
            points_awarded: g[:points_awarded],
            feedback: g[:feedback],
            graded_at: Time.current,
            graded_by: Current.user
          )
        end

        @quiz_attempt.calculate_score!
        notify_quiz_graded!(@quiz_attempt)
        render json: @quiz_attempt
      end

      private

      def set_quiz
        @quiz = Quiz.find(params[:quiz_id])
      end

      def set_quiz_attempt
        @quiz_attempt = QuizAttempt.includes(:attempt_answers, :quiz, :user).find(params[:id])
      end

      def notify_quiz_graded!(quiz_attempt)
        return unless quiz_attempt.status == "graded"
        return if Notification.exists?(
          user_id: quiz_attempt.user_id,
          notification_type: "quiz_graded",
          notifiable_type: "QuizAttempt",
          notifiable_id: quiz_attempt.id
        )

        NotificationService.notify(
          user: quiz_attempt.user,
          event_type: "quiz_graded",
          title: "Quiz graded: #{quiz_attempt.quiz.title}",
          message: "Your quiz attempt has been graded.",
          url: "/learn/courses/#{quiz_attempt.quiz.course_id}/quizzes/#{quiz_attempt.quiz_id}",
          notifiable: quiz_attempt,
          metadata: {
            quiz_id: quiz_attempt.quiz_id,
            quiz_title: quiz_attempt.quiz.title
          }
        )
      end
    end
  end
end
