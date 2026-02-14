module Api
  module V1
    class SyncLogsController < ApplicationController
      def index
        authorize SyncLog
        logs = policy_scope(SyncLog)
          .where(sync_run_id: params[:sync_run_id])
          .order(created_at: :asc)

        logs = logs.where(level: params[:level]) if params[:level].present?

        render json: logs
      end
    end
  end
end
