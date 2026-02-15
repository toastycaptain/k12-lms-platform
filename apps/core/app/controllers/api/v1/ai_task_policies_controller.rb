module Api
  module V1
    class AiTaskPoliciesController < ApplicationController
      before_action :set_policy, only: [ :show, :update, :destroy ]

      def index
        policies = policy_scope(AiTaskPolicy)
        policies = paginate(policies)
        render json: policies
      end

      def show
        authorize @ai_task_policy
        render json: @ai_task_policy
      end

      def create
        @ai_task_policy = AiTaskPolicy.new(policy_params)
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
        if @ai_task_policy.update(policy_params)
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

      def set_policy
        @ai_task_policy = AiTaskPolicy.find(params[:id])
      end

      def policy_params
        params.permit(:ai_provider_config_id, :task_type, :enabled, :max_tokens_limit,
                      :model_override, :requires_approval, :temperature_limit, allowed_roles: [], settings: {})
      end
    end
  end
end
