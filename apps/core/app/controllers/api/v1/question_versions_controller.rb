module Api
  module V1
    class QuestionVersionsController < ApplicationController
      before_action :set_question
      before_action :set_question_version, only: [ :show ]

      def index
        authorize QuestionVersion.new(question: @question)

        versions = policy_scope(@question.question_versions).order(version_number: :desc)
        versions = paginate(versions)

        render json: versions
      end

      def show
        authorize @question_version
        render json: @question_version
      end

      def create
        question_version = @question.question_versions.build(question_version_params)
        question_version.tenant = Current.tenant
        question_version.created_by ||= Current.user
        question_version.version_number ||= next_version_number
        authorize question_version

        if question_version.save
          @question.update!(current_version: question_version)
          render json: question_version, status: :created
        else
          render json: { errors: question_version.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def set_question
        @question = Question.find(params[:question_id])
      end

      def set_question_version
        @question_version = @question.question_versions.find(params[:id])
      end

      def next_version_number
        (@question.question_versions.maximum(:version_number) || 0) + 1
      end

      def question_version_params
        params.permit(:version_number, :question_type, :content, :explanation, :points, :status,
          choices: {},
          correct_answer: {},
          metadata: {})
      end
    end
  end
end
