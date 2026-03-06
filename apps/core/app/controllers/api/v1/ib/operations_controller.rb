module Api
  module V1
    module Ib
      class OperationsController < BaseController
        def show
          authorize CurriculumDocument, :index?
          render json: ::Ib::Operations::PayloadBuilder.new(user: Current.user, school: current_school_scope).build
        end
      end
    end
  end
end
