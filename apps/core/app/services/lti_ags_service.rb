class LtiAgsService
  SCOPE_LINEITEM = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem"
  SCOPE_LINEITEM_READONLY = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly"
  SCOPE_RESULT_READONLY = "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly"
  SCOPE_SCORE = "https://purl.imsglobal.org/spec/lti-ags/scope/score"

  VALID_SCOPES = [ SCOPE_LINEITEM, SCOPE_LINEITEM_READONLY, SCOPE_RESULT_READONLY, SCOPE_SCORE ].freeze

  class << self
    def validate_access_token(authorization_header, required_scopes: [])
      return nil unless authorization_header&.start_with?("Bearer ")

      token = authorization_header.split(" ", 2).last
      begin
        decoded = JWT.decode(
          token,
          LtiService.platform_keypair.public_key,
          true,
          { algorithms: [ "RS256" ] }
        )
        payload = decoded.first

        required_scopes.each do |scope|
          scopes = payload["scopes"] || []
          return nil unless scopes.include?(scope)
        end

        payload
      rescue JWT::DecodeError
        nil
      end
    end

    def generate_access_token(registration, scopes)
      now = Time.current.to_i
      payload = {
        iss: Rails.application.credentials.dig(:lti, :issuer) || "https://lms.example.com",
        sub: registration.client_id,
        aud: registration.auth_token_url,
        iat: now,
        exp: now + 3600,
        scopes: scopes
      }

      JWT.encode(payload, LtiService.platform_keypair, "RS256", { kid: "lti-platform-key" })
    end

    def assignment_to_line_item(assignment)
      {
        id: assignment.id,
        scoreMaximum: assignment.points_possible.to_f,
        label: assignment.title,
        resourceId: assignment.id.to_s,
        tag: assignment.assignment_type
      }
    end

    def post_score(assignment, user_id, score_data)
      submission = assignment.submissions.find_or_initialize_by(user_id: user_id)
      submission.tenant = Current.tenant
      submission.status = "graded"
      submission.grade = score_data[:scoreGiven]
      submission.graded_at = Time.current
      submission.submitted_at ||= Time.current
      submission.save!
      submission
    end
  end
end
