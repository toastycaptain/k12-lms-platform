module Api
  module V1
    class AiProviderConfigsController < ApplicationController
      before_action :set_config, only: [ :show, :update, :destroy, :activate, :deactivate ]

      def index
        configs = policy_scope(AiProviderConfig)
        configs = paginate(configs)
        render json: configs.map { |config| serialize_config(config) }
      end

      def show
        authorize @config
        render json: serialize_config(@config)
      end

      def create
        @config = AiProviderConfig.new(config_params)
        @config.tenant = Current.tenant
        @config.created_by = Current.user
        authorize @config
        if @config.save
          render json: serialize_config(@config), status: :created
        else
          render json: { errors: @config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @config
        if @config.update(config_params)
          render json: serialize_config(@config)
        else
          render json: { errors: @config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @config
        @config.destroy!
        head :no_content
      rescue ActiveRecord::DeleteRestrictionError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      def activate
        authorize @config
        @config.activate!
        render json: serialize_config(@config)
      end

      def deactivate
        authorize @config
        @config.deactivate!
        render json: serialize_config(@config)
      end

      private

      def set_config
        @config = AiProviderConfig.find(params[:id])
      end

      def config_params
        params.permit(:provider_name, :display_name, :default_model, :api_key, :status, available_models: [], settings: {})
      end

      def serialize_config(config)
        config.as_json(
          only: [
            :id,
            :tenant_id,
            :created_by_id,
            :provider_name,
            :display_name,
            :default_model,
            :status,
            :available_models,
            :settings,
            :created_at,
            :updated_at
          ]
        )
      end
    end
  end
end
