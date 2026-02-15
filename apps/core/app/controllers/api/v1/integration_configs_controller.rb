module Api
  module V1
    class IntegrationConfigsController < ApplicationController
      before_action :set_integration_config, only: [ :show, :update, :destroy, :activate, :deactivate, :sync_courses,
        :sync_organizations, :sync_users ]

      def index
        authorize IntegrationConfig
        configs = policy_scope(IntegrationConfig)
        render json: configs
      end

      def show
        authorize @integration_config
        render json: @integration_config
      end

      def create
        @integration_config = IntegrationConfig.new(integration_config_params)
        @integration_config.tenant = Current.tenant
        @integration_config.created_by = Current.user
        authorize @integration_config
        if @integration_config.save
          render json: @integration_config, status: :created
        else
          render json: { errors: @integration_config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @integration_config
        if @integration_config.update(integration_config_params)
          render json: @integration_config
        else
          render json: { errors: @integration_config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @integration_config
        @integration_config.destroy!
        head :no_content
      end

      def activate
        authorize @integration_config
        @integration_config.activate!
        render json: @integration_config
      end

      def deactivate
        authorize @integration_config
        @integration_config.deactivate!
        render json: @integration_config
      end

      def sync_courses
        authorize @integration_config
        unless @integration_config.provider == "google_classroom"
          render json: { error: "sync_courses is only available for google_classroom integrations" }, status: :unprocessable_content
          return
        end

        ClassroomCourseSyncJob.perform_later(@integration_config.id, Current.user.id)
        audit_event(
          "integration.sync_courses_triggered",
          auditable: @integration_config,
          metadata: { provider: @integration_config.provider }
        )
        render json: { message: "Sync triggered" }, status: :accepted
      end

      def sync_organizations
        authorize @integration_config
        unless @integration_config.provider == "oneroster"
          render json: { error: "sync_organizations is only available for oneroster integrations" }, status: :unprocessable_content
          return
        end

        OneRosterOrgSyncJob.perform_later(@integration_config.id, Current.user.id)
        audit_event(
          "integration.oneroster_org_sync_triggered",
          auditable: @integration_config,
          metadata: { provider: @integration_config.provider }
        )
        render json: { message: "Organization sync triggered" }, status: :accepted
      end

      def sync_users
        authorize @integration_config
        unless @integration_config.provider == "oneroster"
          render json: { error: "sync_users is only available for oneroster integrations" }, status: :unprocessable_content
          return
        end

        OneRosterUserSyncJob.perform_later(@integration_config.id, Current.user.id)
        audit_event(
          "integration.oneroster_user_sync_triggered",
          auditable: @integration_config,
          metadata: { provider: @integration_config.provider }
        )
        render json: { message: "User and enrollment sync triggered" }, status: :accepted
      end

      private

      def set_integration_config
        @integration_config = IntegrationConfig.find(params[:id])
      end

      def integration_config_params
        params.permit(:provider, settings: {})
      end
    end
  end
end
