module Api
  module V1
    module Admin
      class BrandingController < ApplicationController
        def show
          authorize :branding, :view?
          render json: Current.tenant.settings.fetch("branding", {})
        end

        def update
          authorize :branding, :manage?
          settings = (Current.tenant.settings || {}).deep_dup
          settings["branding"] ||= {}
          settings["branding"].merge!(branding_params.to_h.compact.stringify_keys)

          Current.tenant.update!(settings: settings)
          render json: settings["branding"]
        end

        private

        def branding_params
          params.permit(:logo_url, :primary_color, :school_name)
        end
      end
    end
  end
end
