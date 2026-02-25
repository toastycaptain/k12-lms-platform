module Api
  module V1
    module Admin
      class AlertConfigurationsController < ApplicationController
        before_action :authorize_admin
        before_action :set_alert_configuration, only: [ :show, :update, :destroy ]

        def index
          configs = policy_scope(AlertConfiguration).order(:name)
          render json: configs
        end

        def show
          authorize @alert_configuration
          render json: @alert_configuration
        end

        def create
          @alert_configuration = AlertConfiguration.new(alert_configuration_params)
          authorize @alert_configuration

          if @alert_configuration.save
            render json: @alert_configuration, status: :created
          else
            render json: { errors: @alert_configuration.errors.full_messages }, status: :unprocessable_content
          end
        end

        def update
          authorize @alert_configuration

          if @alert_configuration.update(alert_configuration_params)
            render json: @alert_configuration
          else
            render json: { errors: @alert_configuration.errors.full_messages }, status: :unprocessable_content
          end
        end

        def destroy
          authorize @alert_configuration
          @alert_configuration.destroy!
          head :no_content
        end

        private

        def authorize_admin
          head :forbidden unless Current.user&.has_role?(:admin)
        end

        def set_alert_configuration
          @alert_configuration = AlertConfiguration.find(params[:id])
        end

        def alert_configuration_params
          params.require(:alert_configuration).permit(
            :tenant_id,
            :name,
            :metric,
            :comparison,
            :threshold,
            :severity,
            :enabled,
            :notification_channel,
            :notification_target,
            :cooldown_minutes
          )
        end
      end
    end
  end
end
