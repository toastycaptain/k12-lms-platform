module Api
  module V1
    module Ib
      class HomeController < BaseController
        def show
          authorize CurriculumDocument, :index?
          render json: ::Ib::Home::PayloadBuilder.new(user: Current.user, school: current_school_scope).build
        end
      end
    end
  end
end
