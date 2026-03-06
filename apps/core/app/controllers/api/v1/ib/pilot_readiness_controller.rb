module Api
  module V1
    module Ib
      class PilotReadinessController < BaseController
        def show
          authorize IbProgrammeSetting
          render json: ::Ib::Support::PilotReadinessService.new(
            tenant: Current.tenant,
            school: current_school_scope
          ).build
        end
      end
    end
  end
end
