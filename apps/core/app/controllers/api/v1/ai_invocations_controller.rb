module Api
  module V1
    class AiInvocationsController < ApplicationController
      before_action :set_ai_invocation, only: [ :show ]

      def index
        authorize AiInvocation
        invocations = policy_scope(AiInvocation)
        invocations = invocations.where(task_type: params[:task_type]) if params[:task_type].present?
        invocations = invocations.where(user_id: params[:user_id]) if params[:user_id].present?
        invocations = invocations.where(status: params[:status]) if params[:status].present?
        invocations = invocations.where("created_at >= ?", params[:start_date]) if params[:start_date].present?
        invocations = invocations.where("created_at <= ?", params[:end_date]) if params[:end_date].present?
        render json: invocations
      end

      def show
        authorize @ai_invocation
        render json: @ai_invocation
      end

      def summary
        authorize AiInvocation, :summary?
        invocations = policy_scope(AiInvocation)

        render json: {
          total_invocations: invocations.count,
          total_tokens: invocations.sum(:total_tokens),
          by_task_type: invocations.group(:task_type).count,
          by_provider: invocations.group(:provider_name).count
        }
      end

      private

      def set_ai_invocation
        @ai_invocation = AiInvocation.find(params[:id])
      end
    end
  end
end
