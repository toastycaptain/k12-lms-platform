module Api
  module V1
    module Ib
      class AnalyticsController < BaseController
        def show
          authorize IbProgrammeSetting
          render json: ::Ib::Support::AnalyticsService.new(
            tenant: Current.tenant,
            school: current_school_scope,
          ).build
        end
      end
    end
  end
end
