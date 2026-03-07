module Api
  module V1
    module Ib
      class PilotSupportController < BaseController
        def show
          authorize IbPilotProfile
          render json: service.build
        end

        private

        def service
          @service ||= ::Ib::Pilot::SupportConsoleService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end
      end
    end
  end
end
