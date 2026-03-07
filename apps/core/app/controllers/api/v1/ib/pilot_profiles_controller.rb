module Api
  module V1
    module Ib
      class PilotProfilesController < BaseController
        def index
          authorize IbPilotProfile
          policy_scope(IbPilotProfile)
          render json: service.index_payload
        end

        def create
          authorize IbPilotProfile
          render json: service.upsert_profile!(profile_params), status: :created
        end

        def update
          authorize IbPilotProfile
          render json: service.upsert_profile!(profile_params.merge(id: params[:id]))
        end

        private

        def service
          @service ||= ::Ib::Pilot::ProgrammeService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def profile_params
          params.fetch(:ib_pilot_profile, params).permit(:name, :status, :cohort_key, :archetype_key, :programme_scope, :launch_window, :go_live_target_on, role_success_metrics: {}, rollout_bundle: {}, metadata: {})
        end
      end
    end
  end
end
