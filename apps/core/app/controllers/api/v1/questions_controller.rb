module Api
  module V1
    class QuestionsController < ApplicationController
      before_action :set_question_bank, only: [ :index, :create ]
      before_action :set_question, only: [ :show, :update, :destroy ]

      def index
        questions = policy_scope(Question).where(question_bank: @question_bank)
        questions = questions.where(question_type: params[:question_type]) if params[:question_type].present?
        render json: questions
      end

      def show
        authorize @question
        render json: @question
      end

      def create
        @question = @question_bank.questions.build(question_params)
        @question.tenant = Current.tenant
        @question.created_by = Current.user
        authorize @question
        if @question.save
          render json: @question, status: :created
        else
          render json: { errors: @question.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @question
        if @question.update(question_params)
          render json: @question
        else
          render json: { errors: @question.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @question
        @question.destroy!
        head :no_content
      end

      private

      def set_question_bank
        @question_bank = QuestionBank.find(params[:question_bank_id])
      end

      def set_question
        @question = Question.find(params[:id])
      end

      def question_params
        params.permit(:question_type, :prompt, :points, :explanation, :position, :status,
          choices: {}, correct_answer: {})
      end
    end
  end
end
