module Api
  module V1
    class QuizItemsController < ApplicationController
      before_action :set_quiz, only: [ :index, :create ]
      before_action :set_quiz_item, only: [ :update, :destroy ]

      def index
        items = policy_scope(QuizItem).where(quiz: @quiz).order(:position)
        render json: items
      end

      def create
        @quiz_item = @quiz.quiz_items.build(quiz_item_params)
        @quiz_item.tenant = Current.tenant
        authorize @quiz_item
        if @quiz_item.save
          render json: @quiz_item, status: :created
        else
          render json: { errors: @quiz_item.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @quiz_item
        if @quiz_item.update(quiz_item_params)
          render json: @quiz_item
        else
          render json: { errors: @quiz_item.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @quiz_item
        @quiz_item.destroy!
        head :no_content
      end

      def reorder_items
        @quiz = Quiz.find(params[:id])
        authorize @quiz, :update?
        item_ids = params[:item_ids] || []
        if item_ids.any?
          # Build a single CASE-based UPDATE instead of N individual updates
          case_sql = "CASE id "
          item_ids.each_with_index do |id, index|
            case_sql += "WHEN #{ActiveRecord::Base.connection.quote(id)} THEN #{index} "
          end
          case_sql += "END"

          QuizItem.where(id: item_ids, quiz_id: @quiz.id).update_all("position = #{case_sql}") # rubocop:disable Rails/SkipsModelValidations
        end
        render json: policy_scope(QuizItem).where(quiz: @quiz).order(:position)
      end

      private

      def set_quiz
        @quiz = Quiz.find(params[:quiz_id])
      end

      def set_quiz_item
        @quiz_item = QuizItem.find(params[:id])
      end

      def quiz_item_params
        params.permit(:question_id, :position, :points)
      end
    end
  end
end
