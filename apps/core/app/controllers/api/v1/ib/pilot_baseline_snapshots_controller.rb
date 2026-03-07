module Api
  module V1
    module Ib
      class PilotBaselineSnapshotsController < BaseController
        def index
          authorize IbPilotBaselineSnapshot
          snapshots = policy_scope(IbPilotBaselineSnapshot).order(captured_at: :desc, id: :desc).limit(20)
          render json: snapshots.map do |snapshot|
            {
              id: snapshot.id,
              pilot_profile_id: snapshot.ib_pilot_profile_id,
              status: snapshot.status,
              captured_at: snapshot.captured_at.utc.iso8601,
              metric_payload: snapshot.metric_payload,
              benchmark_payload: snapshot.benchmark_payload
            }
          end
        end

        def create
          authorize IbPilotBaselineSnapshot
          profile = policy_scope(IbPilotProfile).find(snapshot_params[:ib_pilot_profile_id])
          render json: service.capture_baseline!(profile, metadata: snapshot_params[:metadata] || {}), status: :created
        end

        private

        def service
          @service ||= ::Ib::Pilot::ProgrammeService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def snapshot_params
          params.fetch(:ib_pilot_baseline_snapshot, params).permit(:ib_pilot_profile_id, metadata: {})
        end
      end
    end
  end
end
