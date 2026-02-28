require "digest"
require "securerandom"

class MobileSessionTokenService
  ACCESS_TOKEN_TTL = 15.minutes
  REFRESH_TOKEN_TTL = 30.days

  def self.issue_session!(user:, tenant:, user_agent: nil, ip_address: nil)
    refresh_token = generate_refresh_token

    mobile_session = MobileSession.unscoped.create!(
      tenant: tenant,
      user: user,
      refresh_token_digest: digest_refresh_token(refresh_token),
      expires_at: REFRESH_TOKEN_TTL.from_now,
      last_used_at: Time.current,
      user_agent: user_agent,
      ip_address: ip_address
    )

    {
      access_token: issue_access_token(mobile_session),
      refresh_token: refresh_token,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL.to_i,
      session_id: mobile_session.id
    }
  end

  def self.refresh_session!(refresh_token:, tenant:, user_agent: nil, ip_address: nil)
    mobile_session = find_refresh_session(refresh_token: refresh_token, tenant: tenant)
    return nil unless mobile_session

    new_refresh_token = generate_refresh_token
    mobile_session.update!(
      refresh_token_digest: digest_refresh_token(new_refresh_token),
      expires_at: REFRESH_TOKEN_TTL.from_now,
      last_used_at: Time.current,
      user_agent: user_agent,
      ip_address: ip_address
    )

    {
      access_token: issue_access_token(mobile_session),
      refresh_token: new_refresh_token,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL.to_i,
      session_id: mobile_session.id
    }
  end

  def self.revoke_session!(refresh_token:, tenant:)
    mobile_session = find_refresh_session(refresh_token: refresh_token, tenant: tenant)
    return false unless mobile_session

    mobile_session.revoke!
    true
  end

  def self.authenticate_access_token(token)
    payload = decode_access_token(token)
    return nil unless payload.is_a?(Hash)
    return nil unless payload["typ"] == "access"
    return nil if payload["exp"].to_i <= Time.current.to_i

    mobile_session = MobileSession.unscoped.find_by(
      id: payload["sid"],
      tenant_id: payload["tid"],
      user_id: payload["uid"]
    )

    return nil unless mobile_session&.active?

    tenant = Tenant.unscoped.find_by(id: payload["tid"])
    user = User.unscoped.find_by(id: payload["uid"], tenant_id: payload["tid"])

    return nil unless tenant && user

    mobile_session.update_column(:last_used_at, Time.current) # rubocop:disable Rails/SkipsModelValidations

    {
      tenant: tenant,
      user: user,
      mobile_session: mobile_session
    }
  end

  def self.find_refresh_session(refresh_token:, tenant:)
    return nil if refresh_token.blank? || tenant.blank?

    MobileSession.unscoped.active.find_by(
      tenant_id: tenant.id,
      refresh_token_digest: digest_refresh_token(refresh_token)
    )
  end

  def self.issue_access_token(mobile_session)
    payload = {
      "typ" => "access",
      "sid" => mobile_session.id,
      "uid" => mobile_session.user_id,
      "tid" => mobile_session.tenant_id,
      "exp" => ACCESS_TOKEN_TTL.from_now.to_i
    }

    access_token_verifier.generate(payload)
  end

  def self.decode_access_token(token)
    access_token_verifier.verified(token)
  rescue StandardError
    nil
  end

  def self.access_token_verifier
    Rails.application.message_verifier(:mobile_access_token)
  end

  def self.generate_refresh_token
    SecureRandom.urlsafe_base64(48)
  end

  def self.digest_refresh_token(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  private_class_method :issue_access_token,
    :decode_access_token,
    :access_token_verifier,
    :generate_refresh_token,
    :digest_refresh_token
end
