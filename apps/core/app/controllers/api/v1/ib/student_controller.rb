module Api
  module V1
    module Ib
      class StudentController < BaseController
        def show
          authorize IbEvidenceItem
          render json: ::Ib::Student::HomePayloadBuilder.new(user: Current.user, school: current_school_scope).build
        end
      end
    end
  end
end
