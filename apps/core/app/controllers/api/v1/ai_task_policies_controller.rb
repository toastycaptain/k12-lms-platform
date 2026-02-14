module Api
  module V1
    class AiTaskPoliciesController < ApplicationController
      before_action :set_ai_task_policy, only: [ :show, :update, :destroy ]

      def index
        authorize AiTaskPolicy
        task_policies = policy_scope(AiTaskPolicy)
        render json: task_policies
      end

      def show
        authorize @ai_task_policy
        render json: @ai_task_policy
      end

      def create
        @ai_task_policy = AiTaskPolicy.new(ai_task_policy_params)
        @ai_task_policy.tenant = Current.tenant
        @ai_task_policy.created_by = Current.user
        authorize @ai_task_policy
        if @ai_task_policy.save
          render json: @ai_task_policy, status: :created
        else
          render json: { errors: @ai_task_policy.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @ai_task_policy
        if @ai_task_policy.update(ai_task_policy_params)
          render json: @ai_task_policy
        else
          render json: { errors: @ai_task_policy.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @ai_task_policy
        @ai_task_policy.destroy!
        head :no_content
      end

      private

      def set_ai_task_policy
        @ai_task_policy = AiTaskPolicy.find(params[:id])
      end

      def ai_task_policy_params
        params.permit(:task_type, :ai_provider_config_id, :model_override,
          :max_tokens_limit, :temperature_limit, :requires_approval, :enabled,
          settings: {}, allowed_roles: [])
      end
    end
  end
end
