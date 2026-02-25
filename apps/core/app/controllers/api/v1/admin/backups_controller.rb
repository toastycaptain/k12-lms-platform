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
          DatabaseBackupJob.perform_later(backup_type: params[:backup_type] || "full")
          render json: { message: "Backup job enqueued" }, status: :accepted
        end

        def status
          authorize :backup, :index?
          latest = BackupRecord.successful.order(created_at: :desc).first
          latest_verified = BackupRecord.latest_verified

          render json: {
            latest_backup: latest&.as_json(only: [ :id, :status, :created_at, :size_bytes, :duration_seconds ]),
            latest_verified: latest_verified&.as_json(only: [ :id, :status, :verified_at ]),
            total_backups: BackupRecord.count,
            failed_count: BackupRecord.where(status: "failed")
              .where("created_at > ?", 30.days.ago)
              .count
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
