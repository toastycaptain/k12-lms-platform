module Api
  module V1
    module Ib
      class MobileSyncDiagnosticsController < BaseController
        before_action :set_diagnostic, only: :update

        def index
          authorize IbMobileSyncDiagnostic
          policy_scope(IbMobileSyncDiagnostic)
          render json: service.index_payload
        end

        def create
          authorize IbMobileSyncDiagnostic
          render json: service.upsert_diagnostic!(diagnostic_params), status: :created
        end

        def update
          authorize @diagnostic
          render json: service.upsert_diagnostic!(diagnostic_params.merge(id: params[:id]))
        end

        private

        def set_diagnostic
          @diagnostic = policy_scope(IbMobileSyncDiagnostic).find(params[:id])
        end

        def service
          @service ||= ::Ib::Mobile::TrustService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def diagnostic_params
          params.fetch(:ib_mobile_sync_diagnostic, params).permit(:device_class, :workflow_key, :status, :queue_depth, :last_synced_at, failure_payload: {}, diagnostics: {}, metadata: {})
        end
      end
    end
  end
end
