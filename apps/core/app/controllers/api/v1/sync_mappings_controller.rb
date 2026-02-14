module Api
  module V1
    class SyncMappingsController < ApplicationController
      before_action :set_integration_config, only: [ :index ]
      before_action :set_sync_mapping, only: [ :show, :destroy, :sync_roster ]

      def index
        authorize SyncMapping
        mappings = policy_scope(SyncMapping).where(integration_config: @integration_config)
        mappings = mappings.where(local_type: params[:local_type]) if params[:local_type].present?
        render json: mappings
      end

      def show
        authorize @sync_mapping
        render json: @sync_mapping
      end

      def destroy
        authorize @sync_mapping
        @sync_mapping.destroy!
        head :no_content
      end

      def sync_roster
        authorize @sync_mapping
        ClassroomRosterSyncJob.perform_later(
          @sync_mapping.integration_config_id,
          Current.user.id,
          @sync_mapping.id
        )
        render json: { message: "Roster sync triggered" }, status: :accepted
      end

      private

      def set_integration_config
        @integration_config = IntegrationConfig.find(params[:integration_config_id])
      end

      def set_sync_mapping
        @sync_mapping = SyncMapping.find(params[:id])
      end
    end
  end
end
