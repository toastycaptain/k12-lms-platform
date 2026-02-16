module Api
  module V1
    class LtiResourceLinksLookupController < ApplicationController
      def show
        link = LtiResourceLink.find(params[:id])
        authorize link, :show?
        render json: link
      end
    end
  end
end
