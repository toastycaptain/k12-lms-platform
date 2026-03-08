module Api
  module V1
    module Ib
      class MobileHubController < BaseController
        def show
          authorize IbMobileSyncDiagnostic
          policy_scope(IbMobileSyncDiagnostic)
          render json: service.build
        end

        private

        def service
          @service ||= ::Ib::Mobile::ActionScopeService.new(
            user: Current.user,
            school: current_school_scope
          )
        end
      end
    end
  end
end
