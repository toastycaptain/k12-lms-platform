module Api
  module V1
    module Ib
      class MigrationSessionsController < BaseController
        before_action :set_session, only: [ :show, :update ]

        def index
          authorize IbMigrationSession
          policy_scope(IbMigrationSession)
          render json: service.index_payload
        end

        def show
          authorize @migration_session
          render json: service.index_payload[:sessions].find { |row| row[:id] == @migration_session.id }
        end

        def create
          authorize IbMigrationSession
          render json: service.upsert_session!(session_params), status: :created
        end

        def update
          authorize @migration_session
          render json: service.upsert_session!(session_params.merge(id: params[:id]))
        end

        private

        def set_session
          @migration_session = policy_scope(IbMigrationSession).find(params[:id])
        end

        def service
          @service ||= ::Ib::Migration::SessionService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def session_params
          params.fetch(:ib_migration_session, params).permit(:ib_pilot_profile_id, :ib_import_batch_id, :source_system, :status, :cutover_state, :session_key, source_inventory: {}, mapping_summary: {}, dry_run_summary: {}, reconciliation_summary: {}, rollback_summary: {}, metadata: {})
        end
      end
    end
  end
end
