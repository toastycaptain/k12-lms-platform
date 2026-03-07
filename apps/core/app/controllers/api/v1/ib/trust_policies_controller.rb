module Api
  module V1
    module Ib
      class TrustPoliciesController < BaseController
        before_action :set_policy_record, only: :update

        def index
          authorize IbTrustPolicy
          policy_scope(IbTrustPolicy)
          render json: service.index_payload
        end

        def create
          authorize IbTrustPolicy
          render json: service.upsert_policy!(policy_params), status: :created
        end

        def update
          authorize @policy_record
          render json: service.upsert_policy!(policy_params.merge(id: params[:id]))
        end

        private

        def set_policy_record
          @policy_record = policy_scope(IbTrustPolicy).find(params[:id])
        end

        def service
          @service ||= ::Ib::Trust::PolicyService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def policy_params
          params.fetch(:ib_trust_policy, params).permit(:audience, :content_type, :status, :cadence_mode, :delivery_mode, :approval_mode, policy_rules: {}, privacy_rules: {}, localization_rules: {}, metadata: {})
        end
      end
    end
  end
end
