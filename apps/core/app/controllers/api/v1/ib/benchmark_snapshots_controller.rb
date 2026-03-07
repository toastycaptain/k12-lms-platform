module Api
  module V1
    module Ib
      class BenchmarkSnapshotsController < BaseController
        def index
          authorize IbBenchmarkSnapshot
          policy_scope(IbBenchmarkSnapshot)
          render json: service.index_payload
        end

        def create
          authorize IbBenchmarkSnapshot
          render json: service.capture!(snapshot_params), status: :created
        end

        private

        def service
          @service ||= ::Ib::Support::BenchmarkRefreshService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def snapshot_params
          params.fetch(:ib_benchmark_snapshot, params).permit(:ib_pilot_profile_id, :benchmark_version, :status, :role_scope, :workflow_family, metadata: {})
        end
      end
    end
  end
end
