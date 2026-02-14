module Api
  module V1
    module Lti
      class LtiController < ApplicationController
        skip_before_action :authenticate_user!, only: [ :launch, :deep_link_response, :jwks ]

        private def skip_authorization? = true

        def launch
          id_token = params[:id_token]
          decoded = validate_lti_launch(id_token)
          unless decoded
            render json: { error: "Invalid LTI launch" }, status: :unauthorized
            return
          end

          render json: { status: "ok", claims: decoded }
        end

        def deep_link_response
          id_token = params[:id_token]
          decoded = validate_lti_launch(id_token)
          unless decoded
            render json: { error: "Invalid LTI launch" }, status: :unauthorized
            return
          end

          permitted_items = params.permit(content_items: [:title, :text, :url, :type, custom: {}])
          items = permitted_items[:content_items]&.map(&:to_h) || []

          render json: { status: "ok", content_items: items }
        end

        def jwks
          key = LtiService.platform_keypair
          jwk = JWT::JWK.new(key)
          render json: { keys: [ jwk.export ] }
        end

        private

        def validate_lti_launch(id_token)
          return nil unless id_token.present?

          begin
            decoded = JWT.decode(id_token, nil, false).first
            client_id = decoded["aud"]
            registration = LtiRegistration.find_by!(client_id: client_id)
            Current.tenant = registration.tenant
            JWT.decode(id_token, registration.public_key, true, algorithm: "RS256").first
          rescue JWT::DecodeError, ActiveRecord::RecordNotFound
            nil
          end
        end
      end
    end
  end
end
