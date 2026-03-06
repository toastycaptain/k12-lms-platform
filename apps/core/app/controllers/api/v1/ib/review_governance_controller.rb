module Api
  module V1
    module Ib
      class ReviewGovernanceController < BaseController
        def show
          authorize Approval, :index?, policy_class: ApprovalPolicy
          render json: ::Ib::Governance::ReviewGovernanceService.new(
            tenant: Current.tenant,
            school: current_school_scope
          ).build
        end
      end
    end
  end
end
