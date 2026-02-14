module Api
  module V1
    module Lti
      class LtiController < ApplicationController
        skip_before_action :authenticate_user!, only: [ :jwks ]

        def jwks
          render json: LtiService.platform_jwks
        end

        def login
          authorize :lti, :login?
          registration = LtiRegistration.find_by!(client_id: params[:client_id])
          result = LtiService.build_login_request(registration, params.permit(:target_link_uri, :login_hint, :lti_message_hint))
          render json: result
        end

        def launch
          authorize :lti, :launch?
          registration = LtiRegistration.find_by!(client_id: params[:client_id])
          claims = LtiService.validate_id_token(params[:id_token], registration)
          launch_jwt = LtiService.build_launch_message(registration, Current.user, nil)
          render json: { claims: claims, launch_jwt: launch_jwt }
        rescue JWT::DecodeError => e
          render json: { error: "Invalid token: #{e.message}" }, status: :unauthorized
        end

        def deep_link
          authorize :lti, :deep_link?
          registration = LtiRegistration.find(params[:registration_id])
          content_items = params[:content_items] || []

          created_links = content_items.map do |item|
            LtiResourceLink.create!(
              tenant: Current.tenant,
              lti_registration: registration,
              title: item[:title] || item["title"],
              description: item[:text] || item["text"],
              url: item[:url] || item["url"],
              custom_params: item[:custom] || item["custom"] || {},
              course_id: params[:course_id]
            )
          end

          response_jwt = LtiService.build_deep_link_response(registration, content_items.map(&:to_unsafe_h))
          render json: { jwt: response_jwt, resource_links: ActiveModelSerializers::SerializableResource.new(created_links).as_json }
        end

        private

        def skip_authorization?
          action_name == "jwks"
        end
      end
    end
  end
end
