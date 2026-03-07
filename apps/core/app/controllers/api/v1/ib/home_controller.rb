module Api
  module V1
    module Ib
      class HomeController < BaseController
        def show
          authorize CurriculumDocument, :index?
          builder = ::Ib::Home::PayloadBuilder.new(user: Current.user, school: current_school_scope)
          payload = builder.build
          ::Ib::Home::ActionConsoleService.new(
            user: Current.user,
            school: current_school_scope,
            programme: payload[:programme]
          ).mark_seen!
          render json: payload
        end
      end
    end
  end
end
