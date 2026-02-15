module Api
  module V1
    class AiTemplatesController < ApplicationController
      before_action :set_template, only: [ :show, :update, :destroy ]

      def index
        templates = policy_scope(AiTemplate)
        templates = paginate(templates)
        render json: templates
      end

      def show
        authorize @template
        render json: @template
      end

      def create
        @template = AiTemplate.new(template_params)
        @template.tenant = Current.tenant
        @template.created_by = Current.user
        authorize @template
        if @template.save
          render json: @template, status: :created
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @template
        if @template.update(template_params)
          render json: @template
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @template
        @template.destroy!
        head :no_content
      end

      private

      def set_template
        @template = AiTemplate.find(params[:id])
      end

      def template_params
        params.permit(:name, :task_type, :system_prompt, :user_prompt_template, :status, variables: [])
      end
    end
  end
end
