module Api
  module V1
    module Ib
      class ReleaseBaselinesController < BaseController
        def show
          authorize IbReleaseBaseline
          render json: service.build
        end

        def verify
          authorize IbReleaseBaseline, :validate_setup?
          render json: service.verify!
        end

        def certify
          authorize IbReleaseBaseline, :certify?
          render json: service.certify!
        end

        def rollback
          authorize IbReleaseBaseline, :rollback?
          render json: service.rollback!
        end

        private

        def service
          @service ||= ::Ib::Governance::ReleaseBaselineService.new(
            tenant: Current.tenant,
            school: current_school_scope,
            actor: Current.user
          )
        end
      end
    end
  end
end
