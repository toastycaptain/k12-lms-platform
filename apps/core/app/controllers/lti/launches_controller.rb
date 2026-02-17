module Lti
  class LaunchesController < ApplicationController
    skip_before_action :authenticate_user!

    private def skip_authorization? = true

    def oidc_login
      registration = LtiRegistration.unscoped.find_by!(
        issuer: params[:iss],
        client_id: params[:client_id],
        status: "active"
      )

      state = SecureRandom.hex(32)
      nonce = SecureRandom.hex(16)

      Rails.cache.write(
        cache_key_for_state(state),
        { "nonce" => nonce, "registration_id" => registration.id },
        expires_in: 10.minutes
      )

      redirect_to build_auth_redirect(registration, state, nonce), allow_other_host: true
    end

    def launch
      state = params[:state].to_s
      id_token = params[:id_token].to_s
      cached = Rails.cache.read(cache_key_for_state(state))

      unless cached.present?
        render json: { error: "Invalid or expired state" }, status: :bad_request
        return
      end

      Rails.cache.delete(cache_key_for_state(state))

      registration = LtiRegistration.unscoped.find(cached["registration_id"] || cached[:registration_id])
      claims = validate_jwt(id_token, registration, cached["nonce"] || cached[:nonce])

      unless claims
        render json: { error: "Invalid token" }, status: :unauthorized
        return
      end

      tenant = registration.tenant
      Current.tenant = tenant
      user = resolve_user(claims, tenant)

      unless user
        render json: { error: "User could not be resolved" }, status: :unprocessable_entity
        return
      end

      Current.user = user
      session[:user_id] = user.id
      session[:tenant_id] = tenant.id

      message_type = claims["https://purl.imsglobal.org/spec/lti/claim/message_type"]

      case message_type
      when "LtiResourceLinkRequest"
        handle_resource_link_launch(claims, registration)
      when "LtiDeepLinkingRequest"
        handle_deep_linking_request(claims, registration)
      else
        redirect_to "#{frontend_url}/dashboard", allow_other_host: true
      end
    end

    def jwks
      key = Rails.application.config.lti_private_key.public_key
      jwk = JWT::JWK.new(key, kid: "k12-lms-platform-key")
      render json: { keys: [ jwk.export ] }
    end

    private

    def cache_key_for_state(state)
      "lti_state:#{state}"
    end

    def build_auth_redirect(registration, state, nonce)
      redirect_params = {
        scope: "openid",
        response_type: "id_token",
        client_id: registration.client_id,
        redirect_uri: "#{request.base_url}/lti/launch",
        login_hint: params[:login_hint],
        lti_message_hint: params[:lti_message_hint],
        state: state,
        nonce: nonce,
        response_mode: "form_post"
      }.compact

      "#{registration.auth_login_url}?#{redirect_params.to_query}"
    end

    def validate_jwt(token, registration, expected_nonce)
      return nil if token.blank?

      validate_external_url!(registration.jwks_url)
      jwks_response = Faraday.get(registration.jwks_url)
      return nil unless jwks_response.success?

      jwks = JSON::JWK::Set.new(JSON.parse(jwks_response.body))
      decoded = JSON::JWT.decode(token, jwks)

      audience = decoded["aud"]
      audience_values = audience.is_a?(Array) ? audience : [ audience ]

      return nil unless decoded["iss"] == registration.issuer
      return nil unless audience_values.include?(registration.client_id)
      return nil unless decoded["nonce"] == expected_nonce
      return nil unless decoded["exp"].to_i > Time.current.to_i

      decoded.to_h
    rescue StandardError => e
      Rails.logger.error("LTI JWT validation failed: #{e.message}")
      nil
    end

    def resolve_user(claims, tenant)
      email = claims["email"] || claims.dig("https://purl.imsglobal.org/spec/lti/claim/ext", "email")
      return nil if email.blank?

      User.unscoped.find_by(email: email.downcase, tenant_id: tenant.id)
    end

    def handle_resource_link_launch(claims, registration)
      resource_link_id = claims.dig("https://purl.imsglobal.org/spec/lti/claim/resource_link", "id")

      link = registration.lti_resource_links.find_by(
        "custom_params->>'resource_link_id' = ?", resource_link_id
      )

      if link&.course_id.present?
        redirect_to "#{frontend_url}/teach/courses/#{link.course_id}", allow_other_host: true
      else
        redirect_to "#{frontend_url}/dashboard", allow_other_host: true
      end
    end

    def handle_deep_linking_request(claims, registration)
      return_url = claims.dig(
        "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings",
        "deep_link_return_url"
      )

      redirect_to(
        "#{frontend_url}/lti/deep-link?registration_id=#{registration.id}&return_url=#{CGI.escape(return_url || "")}",
        allow_other_host: true
      )
    end

    def validate_external_url!(url)
      uri = URI.parse(url)
      blocked = %w[localhost 127.0.0.1 0.0.0.0 ::1 169.254.169.254 metadata.google.internal]
      if blocked.include?(uri.host&.downcase)
        raise SecurityError, "Cannot fetch from internal address: #{uri.host}"
      end

      begin
        addr = IPAddr.new(uri.host)
        if addr.private? || addr.loopback? || addr.link_local?
          raise SecurityError, "Cannot fetch from private IP: #{uri.host}"
        end
      rescue IPAddr::InvalidAddressError
        # Hostname — fine
      end
    rescue URI::InvalidURIError
      raise SecurityError, "Invalid URL: #{url}"
    end

    def frontend_url
      origins = ENV["CORS_ORIGINS"].presence || ENV["FRONTEND_URL"].presence || "http://localhost:3000"
      origins.split(",").first.to_s.strip
    end
  end
end
