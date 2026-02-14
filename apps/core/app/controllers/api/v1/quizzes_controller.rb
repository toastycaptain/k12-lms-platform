module Api
  module V1
    class QuizzesController < ApplicationController
      before_action :set_course, only: [ :index, :create ]
      before_action :set_quiz, only: [ :show, :update, :destroy, :publish, :close ]

      def index
        quizzes = policy_scope(Quiz).where(course: @course)
        quizzes = quizzes.where(status: params[:status]) if params[:status].present?
        render json: quizzes
      end

      def show
        authorize @quiz
        render json: @quiz
      end

      def create
        @quiz = @course.quizzes.build(quiz_params)
        @quiz.tenant = Current.tenant
        @quiz.created_by = Current.user
        authorize @quiz
        if @quiz.save
          render json: @quiz, status: :created
        else
          render json: { errors: @quiz.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @quiz
        if @quiz.update(quiz_params)
          render json: @quiz
        else
          render json: { errors: @quiz.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @quiz
        @quiz.destroy!
        head :no_content
      end

      def publish
        authorize @quiz
        @quiz.publish!
        render json: @quiz
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot publish a #{@quiz.status} quiz" ] }, status: :unprocessable_content
      end

      def close
        authorize @quiz
        @quiz.close!
        render json: @quiz
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot close a #{@quiz.status} quiz" ] }, status: :unprocessable_content
      end

      private

      def set_course
        @course = Course.find(params[:course_id])
      end

      def set_quiz
        @quiz = Quiz.find(params[:id])
      end

      def quiz_params
        params.permit(:title, :description, :instructions, :quiz_type, :time_limit_minutes,
          :attempts_allowed, :shuffle_questions, :shuffle_choices, :show_results,
          :due_at, :unlock_at, :lock_at)
      end
    end
  end
end
