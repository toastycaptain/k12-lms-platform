module Api
  module V1
    module Ib
      class RolloutController < BaseController
        def show
          authorize IbProgrammeSetting
          render json: ::Ib::Governance::RolloutConsoleService.new(
            tenant: Current.tenant,
            school: current_school_scope
          ).build
        end
      end
    end
  end
end
