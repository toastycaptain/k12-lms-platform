module Api
  module V1
    class DataRetentionPoliciesController < ApplicationController
      before_action :set_policy, only: [ :show, :update, :destroy, :run ]

      def index
        authorize DataRetentionPolicy
        policies = policy_scope(DataRetentionPolicy)
        render json: policies
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

      def run
        authorize @data_retention_policy
        DataRetentionEnforcementJob.perform_later(@data_retention_policy.id)
        render json: { message: "Data retention enforcement job enqueued" }, status: :accepted
      end

      private

      def set_policy
        @data_retention_policy = DataRetentionPolicy.find(params[:id])
      end

      def data_retention_policy_params
        permitted = params.permit(:name, :entity_type, :retention_days, :policy_action, :enabled, settings: {})
        # Rename policy_action to action to avoid Rails param conflict
        permitted[:action] = permitted.delete(:policy_action) if permitted.key?(:policy_action)
        permitted
      end
    end
  end
end
