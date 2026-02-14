class GoogleTokenService
  attr_reader :user

  def initialize(user)
    @user = user
  end

  def valid_token?
    user.google_access_token.present? &&
      user.google_token_expires_at.present? &&
      user.google_token_expires_at > 5.minutes.from_now
  end

  def access_token
    refresh! unless valid_token?
    user.google_access_token
  end

  def refresh!
    raise "No refresh token available" unless user.google_refresh_token.present?

    uri = URI("https://oauth2.googleapis.com/token")
    response = Net::HTTP.post_form(uri, {
      client_id: ENV.fetch("GOOGLE_CLIENT_ID", "test-client-id"),
      client_secret: ENV.fetch("GOOGLE_CLIENT_SECRET", "test-client-secret"),
      refresh_token: user.google_refresh_token,
      grant_type: "refresh_token"
    })

    data = JSON.parse(response.body)
    raise "Token refresh failed: #{data['error']}" unless data["access_token"]

    user.update!(
      google_access_token: data["access_token"],
      google_token_expires_at: Time.current + data["expires_in"].to_i.seconds
    )
  end
end
