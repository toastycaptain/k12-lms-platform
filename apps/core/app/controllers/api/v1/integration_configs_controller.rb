module Api
  module V1
    class IntegrationConfigsController < ApplicationController
      before_action :set_integration_config, only: [
        :show, :update, :destroy, :activate, :deactivate, :sync_courses,
        :test_connection, :sync_orgs, :sync_users, :sync_classes, :sync_enrollments,
        :import_csv, :import_status
      ]

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
        ClassroomCourseSyncJob.perform_later(@integration_config.id, Current.user.id)
        render json: { message: "Sync triggered" }, status: :accepted
      end

      def test_connection
        authorize @integration_config
        settings = @integration_config.settings
        client = OneRosterClient.new(
          base_url: settings["base_url"],
          client_id: settings["client_id"],
          client_secret: settings["client_secret"]
        )
        orgs = client.get_all_orgs(limit: 1)
        render json: { status: "ok", org_count: orgs.length }
      rescue OneRosterError => e
        render json: { status: "error", message: e.message }
      end

      def sync_orgs
        authorize @integration_config
        OneRosterOrgSyncJob.perform_later(@integration_config.id, Current.user.id)
        render json: { message: "Org sync triggered" }, status: :accepted
      end

      def sync_users
        authorize @integration_config
        OneRosterUserSyncJob.perform_later(@integration_config.id, Current.user.id)
        render json: { message: "User sync triggered" }, status: :accepted
      end

      def sync_classes
        authorize @integration_config
        OneRosterClassSyncJob.perform_later(@integration_config.id, Current.user.id)
        render json: { message: "Class sync triggered" }, status: :accepted
      end

      def sync_enrollments
        authorize @integration_config
        OneRosterEnrollmentSyncJob.perform_later(@integration_config.id, Current.user.id)
        render json: { message: "Enrollment sync triggered" }, status: :accepted
      end

      def import_csv
        authorize @integration_config
        file = params[:file]
        unless file
          render json: { error: "No file provided" }, status: :unprocessable_content
          return
        end

        @integration_config.import_file.attach(file)
        OneRosterCsvImportJob.perform_later(@integration_config.id, @integration_config.import_file.blob.id, Current.user.id)
        render json: { message: "CSV import triggered" }, status: :accepted
      end

      def import_status
        authorize @integration_config
        sync_run = @integration_config.sync_runs.where(sync_type: "oneroster_csv_import").order(created_at: :desc).first

        if sync_run
          render json: {
            status: sync_run.status,
            records_processed: sync_run.records_processed,
            records_succeeded: sync_run.records_succeeded,
            records_failed: sync_run.records_failed,
            error_message: sync_run.error_message,
            started_at: sync_run.started_at,
            completed_at: sync_run.completed_at
          }
        else
          render json: { status: "none", message: "No CSV import has been run" }
        end
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
