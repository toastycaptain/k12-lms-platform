module Api
  module V1
    class CurriculumProfilesController < ApplicationController
      def index
        authorize :curriculum_profile, :index?
        profiles = policy_scope(CurriculumProfile)
        render json: profiles
      end
    end
  end
end
