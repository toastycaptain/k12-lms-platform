module Api
  module V1
    module Ib
      class SearchProfilesController < BaseController
        before_action :set_profile, only: :update

        def index
          authorize IbSearchProfile
          policy_scope(IbSearchProfile)
          render json: service.index_payload
        end

        def create
          authorize IbSearchProfile
          render json: service.upsert_profile!(profile_params), status: :created
        end

        def update
          authorize @profile
          render json: service.upsert_profile!(profile_params.merge(id: params[:id]))
        end

        private

        def set_profile
          @profile = policy_scope(IbSearchProfile).find(params[:id])
        end

        def service
          @service ||= ::Ib::Search::ProfileService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def profile_params
          params.fetch(:ib_search_profile, params).permit(:key, :status, :latency_budget_ms, facet_config: {}, ranking_rules: {}, scope_rules: {}, metadata: {})
        end
      end
    end
  end
end
