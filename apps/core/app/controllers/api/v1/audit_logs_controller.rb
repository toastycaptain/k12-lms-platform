module Api
  module V1
    class AuditLogsController < ApplicationController
      def index
        authorize AuditLog
        audit_logs = policy_scope(AuditLog).recent
        audit_logs = audit_logs.for_user(params[:user_id]) if params[:user_id].present?
        audit_logs = audit_logs.for_auditable(params[:auditable_type], params[:auditable_id]) if params[:auditable_type].present?
        audit_logs = audit_logs.for_action(params[:action_filter]) if params[:action_filter].present?
        audit_logs = audit_logs.where("audit_logs.created_at >= ?", Time.zone.parse(params[:start_date])) if params[:start_date].present?
        audit_logs = audit_logs.where("audit_logs.created_at <= ?", Time.zone.parse(params[:end_date]).end_of_day) if params[:end_date].present?

        per_page = (params[:per_page] || 50).to_i
        page = (params[:page] || 1).to_i
        offset = (page - 1) * per_page

        total = audit_logs.count
        audit_logs = audit_logs.limit(per_page).offset(offset)

        render json: {
          audit_logs: ActiveModelSerializers::SerializableResource.new(audit_logs).as_json,
          meta: { total: total, page: page, per_page: per_page }
        }
      end

      def summary
        authorize :audit_log, :summary?
        thirty_days_ago = 30.days.ago

        by_action = AuditLog.where("audit_logs.created_at >= ?", thirty_days_ago)
          .group(:action).count

        by_day = AuditLog.where("audit_logs.created_at >= ?", thirty_days_ago)
          .group("DATE(audit_logs.created_at)").count

        render json: {
          by_action: by_action,
          by_day: by_day
        }
      end
    end
  end
end
