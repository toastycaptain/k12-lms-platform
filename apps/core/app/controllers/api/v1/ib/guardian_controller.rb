module Api
  module V1
    module Ib
      class GuardianController < BaseController
        def show
          authorize IbLearningStory
          render json: ::Ib::Guardian::HomePayloadBuilder.new(user: Current.user, school: current_school_scope).build
        end
      end
    end
  end
end
