module Api
  module V1
    module Admin
      class DeployController < ApplicationController
        def window
          authorize :deploy, :view?
          render json: DeployWindowService.current_status
        end
      end
    end
  end
end
