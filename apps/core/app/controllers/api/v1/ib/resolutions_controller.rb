module Api
  module V1
    module Ib
      class ResolutionsController < BaseController
        def show
          resolution = ::Ib::Support::RouteResolutionService.new(
            user: Current.user,
            tenant: Current.tenant,
            school: current_school_scope
          ).resolve(entity_ref: params[:entity_ref], href: params[:href])

          ::Ib::Support::Telemetry.emit(
            event: "ib.route.resolve",
            tenant: Current.tenant,
            user: Current.user,
            school: current_school_scope,
            metadata: {
              entity_ref: params[:entity_ref],
              href: params[:href],
              status: resolution[:status],
              route_id: resolution[:route_id]
            }
          )

          render json: resolution
        end

        private

        def skip_authorization?
          true
        end
      end
    end
  end
end
