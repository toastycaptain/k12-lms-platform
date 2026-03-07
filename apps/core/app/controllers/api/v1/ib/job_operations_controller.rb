module Api
  module V1
    module Ib
      class JobOperationsController < BaseController
        def show
          authorize IbProgrammeSetting
          render json: service.build
        end

        def replay
          authorize IbProgrammeSetting
          service.replay!(operation_type: params.require(:operation_type), id: params.require(:id))
          render json: service.build
        end

        private

        def service
          @service ||= ::Ib::Support::JobOperationsService.new(
            tenant: Current.tenant,
            school: current_school_scope || School.where(tenant_id: Current.tenant.id).first!,
            actor: Current.user,
          )
        end
      end
    end
  end
end
