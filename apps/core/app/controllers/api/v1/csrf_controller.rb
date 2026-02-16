module Api
  module V1
    class CsrfController < ApplicationController
      skip_before_action :authenticate_user!

      private def skip_authorization? = true

      def show
        render json: { token: form_authenticity_token }
      end
    end
  end
end
