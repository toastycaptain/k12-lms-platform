module Api
  module V1
    class DataRetentionPoliciesController < ApplicationController
      before_action :set_data_retention_policy, only: [ :show, :update, :destroy, :enforce ]

      def index
        authorize DataRetentionPolicy
        render json: policy_scope(DataRetentionPolicy).order(updated_at: :desc)
      end

      def show
        authorize @data_retention_policy
        render json: @data_retention_policy
      end

      def create
        @data_retention_policy = DataRetentionPolicy.new(data_retention_policy_params)
        @data_retention_policy.tenant = Current.tenant
        @data_retention_policy.created_by = Current.user
        authorize @data_retention_policy

        if @data_retention_policy.save
          render json: @data_retention_policy, status: :created
        else
          render json: { errors: @data_retention_policy.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @data_retention_policy
        if @data_retention_policy.update(data_retention_policy_params)
          render json: @data_retention_policy
        else
          render json: { errors: @data_retention_policy.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @data_retention_policy
        @data_retention_policy.destroy!
        head :no_content
      end

      def enforce
        authorize @data_retention_policy
        DataRetentionEnforcementJob.perform_later(@data_retention_policy.id)
        render json: { message: "Retention enforcement queued" }, status: :accepted
      end

      private

      def set_data_retention_policy
        @data_retention_policy = DataRetentionPolicy.find(params[:id])
      end

      def data_retention_policy_params
        params.require(:data_retention_policy).permit(
          :name,
          :entity_type,
          :action,
          :retention_days,
          :enabled,
          settings: [ :archive_to, :notify_before_days, :exempt_roles ]
        )
      end
    end
  end
end
