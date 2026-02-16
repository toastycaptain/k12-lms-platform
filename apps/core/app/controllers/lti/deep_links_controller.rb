module Lti
  class DeepLinksController < ApplicationController
    def create
      registration = LtiRegistration.find(params[:registration_id])
      authorize registration, :show?

      items = normalize_items(params[:items])
      jwt = build_deep_linking_jwt(registration, items, params[:data])

      render json: {
        jwt: jwt,
        return_url: params[:return_url]
      }
    end

    private

    def normalize_items(raw_items)
      Array(raw_items).filter_map do |item|
        permitted = if item.respond_to?(:permit)
          item.permit(:title, :url, custom_params: {}).to_h
        elsif item.respond_to?(:to_h)
          item.to_h
        else
          {}
        end

        title = permitted["title"] || permitted[:title]
        url = permitted["url"] || permitted[:url]
        custom_params = permitted["custom_params"] || permitted[:custom_params] || {}

        next if title.blank? || url.blank?

        {
          type: "ltiResourceLink",
          title: title,
          url: url,
          custom: custom_params
        }
      end
    end

    def build_deep_linking_jwt(registration, items, data)
      private_key = Rails.application.config.lti_private_key

      payload = {
        iss: registration.client_id,
        aud: registration.issuer,
        iat: Time.current.to_i,
        exp: 5.minutes.from_now.to_i,
        nonce: SecureRandom.hex(16),
        "https://purl.imsglobal.org/spec/lti/claim/message_type" => "LtiDeepLinkingResponse",
        "https://purl.imsglobal.org/spec/lti/claim/version" => "1.3.0",
        "https://purl.imsglobal.org/spec/lti-dl/claim/content_items" => items,
        "https://purl.imsglobal.org/spec/lti-dl/claim/data" => data
      }

      JWT.encode(payload, private_key, "RS256", kid: "k12-lms-platform-key")
    end
  end
end
