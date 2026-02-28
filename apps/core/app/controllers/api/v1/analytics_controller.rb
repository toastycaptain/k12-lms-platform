module Api
  module V1
    class AnalyticsController < ApplicationController
      skip_before_action :authenticate_user!
      skip_forgery_protection

      def web_vitals
        payload = params.permit(:name, :value, :path)

        MetricsService.gauge(
          "web_vitals",
          payload[:value].to_f,
          tags: {
            metric: payload[:name].to_s.presence || "unknown",
            path: payload[:path].to_s.presence || "unknown",
            tenant_id: Current.tenant&.id,
            user_id: Current.user&.id
          }
        )

        head :accepted
      end

      private

      def skip_authorization?
        true
      end
    end
  end
end
