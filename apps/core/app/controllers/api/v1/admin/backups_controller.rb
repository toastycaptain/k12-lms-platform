module Api
  module V1
    module Admin
      class BackupsController < ApplicationController
        before_action :authorize_admin

        def index
          records = policy_scope(BackupRecord).recent
          render json: records, each_serializer: BackupRecordSerializer
        end

        def show
          record = BackupRecord.find(params[:id])
          authorize :backup, :show?
          render json: record, serializer: BackupRecordSerializer
        end

        def create
          authorize :backup, :create?
          BackupService.trigger_backup(backup_type: params[:backup_type] || "full")
          render json: { message: "Backup job enqueued" }, status: :accepted
        rescue ArgumentError => e
          render json: { error: e.message }, status: :unprocessable_content
        end

        def status
          authorize :backup, :index?
          summary = BackupService.status_summary

          render json: {
            latest_backup: summary[:latest_backup]&.as_json(only: [ :id, :status, :created_at, :size_bytes, :duration_seconds ]),
            latest_verified: summary[:latest_verified]&.as_json(only: [ :id, :status, :verified_at ]),
            total_backups: summary[:total_backups],
            failed_count: summary[:failed_last_30_days]
          }
        end

        private

        def authorize_admin
          head :forbidden unless Current.user&.has_role?(:admin)
        end
      end
    end
  end
end
