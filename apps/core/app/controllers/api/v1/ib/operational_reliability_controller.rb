module Api
  module V1
    module Ib
      class OperationalReliabilityController < BaseController
        def show
          authorize IbOperationalJob
          render json: ::Ib::Support::OperationalReliabilityService.new(
            tenant: Current.tenant,
            school: current_school_scope
          ).build
        end
      end
    end
  end
end
