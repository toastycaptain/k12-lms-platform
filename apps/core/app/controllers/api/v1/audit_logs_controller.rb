module Api
  module V1
    class AuditLogsController < ApplicationController
      def index
        authorize AuditLog
        limit = params[:limit].presence&.to_i || 50
        limit = [ [ limit, 1 ].max, 200 ].min
        logs = policy_scope(AuditLog).recent.limit(limit)
        render json: logs
      end
    end
  end
end
