module Api
  module V1
    module Admin
      class OperationsController < ApplicationController
        before_action :authorize_admin

        def health
          authorize :operations, :view?
          render json: SystemHealthService.check_all
        end

        private

        def authorize_admin
          head :forbidden unless Current.user&.has_role?(:admin)
        end
      end
    end
  end
end
