module Api
  module V1
    module Ib
      class ReplacementReadinessController < BaseController
        def show
          authorize IbReplacementReadinessSnapshot
          render json: service.build
        end

        def create
          authorize IbReplacementReadinessSnapshot
          render json: service.generate!, status: :created
        end

        private

        def service
          @service ||= ::Ib::Readiness::ReplacementReadinessService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end
      end
    end
  end
end
