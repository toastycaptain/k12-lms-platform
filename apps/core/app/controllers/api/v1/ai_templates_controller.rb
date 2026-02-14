module Api
  module V1
    class AiTemplatesController < ApplicationController
      before_action :set_ai_template, only: [ :show, :update, :destroy, :activate, :archive ]

      def index
        authorize AiTemplate
        templates = policy_scope(AiTemplate)
        templates = templates.for_task_type(params[:task_type]) if params[:task_type].present?
        templates = templates.where(status: params[:status]) if params[:status].present?
        render json: templates
      end

      def show
        authorize @ai_template
        render json: @ai_template
      end

      def create
        @ai_template = AiTemplate.new(ai_template_params)
        @ai_template.tenant = Current.tenant
        @ai_template.created_by = Current.user
        authorize @ai_template
        if @ai_template.save
          render json: @ai_template, status: :created
        else
          render json: { errors: @ai_template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @ai_template
        if @ai_template.update(ai_template_params)
          render json: @ai_template
        else
          render json: { errors: @ai_template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @ai_template
        @ai_template.destroy!
        head :no_content
      end

      def activate
        authorize @ai_template
        @ai_template.activate!
        render json: @ai_template
      end

      def archive
        authorize @ai_template
        @ai_template.archive!
        render json: @ai_template
      end

      private

      def set_ai_template
        @ai_template = AiTemplate.find(params[:id])
      end

      def ai_template_params
        params.permit(:task_type, :name, :system_prompt, :user_prompt_template,
          :status, variables: [ :name, :description, :required ])
      end
    end
  end
end
