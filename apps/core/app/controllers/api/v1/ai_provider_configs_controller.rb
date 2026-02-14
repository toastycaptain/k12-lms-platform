module Api
  module V1
    class AiProviderConfigsController < ApplicationController
      before_action :set_ai_provider_config, only: [ :show, :update, :destroy, :activate, :deactivate ]

      def index
        authorize AiProviderConfig
        configs = policy_scope(AiProviderConfig)
        render json: configs
      end

      def show
        authorize @ai_provider_config
        render json: @ai_provider_config
      end

      def create
        @ai_provider_config = AiProviderConfig.new(ai_provider_config_params)
        @ai_provider_config.tenant = Current.tenant
        @ai_provider_config.created_by = Current.user
        authorize @ai_provider_config
        if @ai_provider_config.save
          render json: @ai_provider_config, status: :created
        else
          render json: { errors: @ai_provider_config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @ai_provider_config
        if @ai_provider_config.update(ai_provider_config_params)
          render json: @ai_provider_config
        else
          render json: { errors: @ai_provider_config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @ai_provider_config
        @ai_provider_config.destroy!
        head :no_content
      end

      def activate
        authorize @ai_provider_config
        @ai_provider_config.activate!
        render json: @ai_provider_config
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "API key must be present to activate" ] }, status: :unprocessable_content
      end

      def deactivate
        authorize @ai_provider_config
        @ai_provider_config.deactivate!
        render json: @ai_provider_config
      end

      private

      def set_ai_provider_config
        @ai_provider_config = AiProviderConfig.find(params[:id])
      end

      def ai_provider_config_params
        params.permit(:provider_name, :display_name, :api_key, :default_model, :status, settings: {}, available_models: [])
      end
    end
  end
end
