module Api
  module V1
    class QuizAccommodationsController < ApplicationController
      before_action :set_quiz, only: [ :index, :create ]
      before_action :set_accommodation, only: [ :update, :destroy ]

      def index
        accommodations = policy_scope(QuizAccommodation).where(quiz: @quiz)
        render json: accommodations
      end

      def create
        @accommodation = @quiz.quiz_accommodations.build(accommodation_params)
        @accommodation.tenant = Current.tenant
        authorize @accommodation
        if @accommodation.save
          render json: @accommodation, status: :created
        else
          render json: { errors: @accommodation.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @accommodation
        if @accommodation.update(accommodation_params)
          render json: @accommodation
        else
          render json: { errors: @accommodation.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @accommodation
        @accommodation.destroy!
        head :no_content
      end

      private

      def set_quiz
        @quiz = Quiz.find(params[:quiz_id])
      end

      def set_accommodation
        @accommodation = QuizAccommodation.find(params[:id])
      end

      def accommodation_params
        params.permit(:user_id, :extra_time_minutes, :extra_attempts, :notes)
      end
    end
  end
end
