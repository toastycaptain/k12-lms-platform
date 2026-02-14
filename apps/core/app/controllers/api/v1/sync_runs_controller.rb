module Api
  module V1
    class SyncRunsController < ApplicationController
      before_action :set_sync_run, only: [ :show ]

      def index
        authorize SyncRun
        runs = policy_scope(SyncRun)
          .where(integration_config_id: params[:integration_config_id])
          .order(created_at: :desc)

        runs = runs.where(status: params[:status]) if params[:status].present?
        runs = runs.where(sync_type: params[:sync_type]) if params[:sync_type].present?

        render json: runs
      end

      def show
        authorize @sync_run
        render json: @sync_run
      end

      private

      def set_sync_run
        @sync_run = SyncRun.find(params[:id])
      end
    end
  end
end
