class LtiService
  LTI_VERSION = "1.3.0"
  LTI_MESSAGE_TYPE = "LtiResourceLinkRequest"
  LTI_DEEP_LINK_MESSAGE_TYPE = "LtiDeepLinkingResponse"

  ROLE_MAPPINGS = {
    admin: "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator",
    teacher: "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
    student: "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
    curriculum_lead: "http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper"
  }.freeze

  class << self
    def platform_keypair
      @platform_keypair ||= begin
        if Rails.application.credentials.dig(:lti, :private_key)
          OpenSSL::PKey::RSA.new(Rails.application.credentials.dig(:lti, :private_key))
        else
          OpenSSL::PKey::RSA.generate(2048)
        end
      end
    end

    def platform_jwks
      key = platform_keypair
      jwk = JWT::JWK.new(key, kid: "lti-platform-key")
      { keys: [ jwk.export ] }
    end

    def build_login_request(registration, params)
      nonce = SecureRandom.uuid
      state = SecureRandom.uuid

      query = {
        scope: "openid",
        response_type: "id_token",
        client_id: registration.client_id,
        redirect_uri: params[:target_link_uri] || registration.auth_login_url,
        login_hint: params[:login_hint],
        lti_message_hint: params[:lti_message_hint],
        state: state,
        response_mode: "form_post",
        nonce: nonce,
        prompt: "none"
      }.compact

      {
        redirect_url: "#{registration.auth_login_url}?#{query.to_query}",
        state: state,
        nonce: nonce
      }
    end

    def validate_id_token(id_token, registration)
      jwks_response = Faraday.get(registration.jwks_url)
      jwks_keys = JSON.parse(jwks_response.body)
      jwk_set = JWT::JWK::Set.new(jwks_keys)

      decoded = JWT.decode(
        id_token,
        nil,
        true,
        {
          algorithms: [ "RS256" ],
          jwks: jwk_set,
          iss: registration.issuer,
          verify_iss: true,
          aud: registration.client_id,
          verify_aud: true
        }
      )
      decoded.first
    end

    def build_launch_message(registration, user, course)
      now = Time.current.to_i
      roles = user.roles.pluck(:name).filter_map { |r| ROLE_MAPPINGS[r.to_sym] }

      payload = {
        iss: Rails.application.credentials.dig(:lti, :issuer) || "https://lms.example.com",
        sub: user.id.to_s,
        aud: registration.client_id,
        exp: now + 3600,
        iat: now,
        nonce: SecureRandom.uuid,
        "https://purl.imsglobal.org/spec/lti/claim/deployment_id" => registration.deployment_id,
        "https://purl.imsglobal.org/spec/lti/claim/message_type" => LTI_MESSAGE_TYPE,
        "https://purl.imsglobal.org/spec/lti/claim/version" => LTI_VERSION,
        "https://purl.imsglobal.org/spec/lti/claim/roles" => roles,
        "https://purl.imsglobal.org/spec/lti/claim/target_link_uri" => registration.settings["target_link_uri"]
      }

      if course
        payload["https://purl.imsglobal.org/spec/lti/claim/context"] = {
          id: course.id.to_s,
          label: course.try(:code) || course.name,
          title: course.name,
          type: [ "http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering" ]
        }
      end

      key = platform_keypair
      JWT.encode(payload, key, "RS256", { kid: "lti-platform-key" })
    end

    def build_deep_link_response(registration, content_items)
      now = Time.current.to_i

      payload = {
        iss: Rails.application.credentials.dig(:lti, :issuer) || "https://lms.example.com",
        aud: registration.client_id,
        exp: now + 3600,
        iat: now,
        nonce: SecureRandom.uuid,
        "https://purl.imsglobal.org/spec/lti/claim/deployment_id" => registration.deployment_id,
        "https://purl.imsglobal.org/spec/lti/claim/message_type" => LTI_DEEP_LINK_MESSAGE_TYPE,
        "https://purl.imsglobal.org/spec/lti/claim/version" => LTI_VERSION,
        "https://purl.imsglobal.org/spec/lti-dl/claim/content_items" => content_items
      }

      key = platform_keypair
      JWT.encode(payload, key, "RS256", { kid: "lti-platform-key" })
    end
  end
end
