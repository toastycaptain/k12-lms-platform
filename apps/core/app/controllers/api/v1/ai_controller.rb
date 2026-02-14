module Api
  module V1
    class AiController < ApplicationController
      def health
        authorize :ai
        client = AiGatewayClient.new
        result = client.health
        render json: result
      rescue AiGatewayError => e
        render json: { error: e.message }, status: :service_unavailable
      end
    end
  end
end
