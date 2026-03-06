module Api
  module V1
    module Ib
      class BaseController < ApplicationController
        private

        def current_school_scope
          return nil unless Current.respond_to?(:school)

          Current.school
        end
      end
    end
  end
end
