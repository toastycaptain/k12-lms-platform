module AuthenticationHelpers
  def sign_in_as(user, tenant: user.tenant)
    post "/auth/google_oauth2/callback", env: {
      "omniauth.auth" => OmniAuth::AuthHash.new(
        provider: "google_oauth2",
        uid: "123456789",
        info: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      )
    }
  end

  def mock_session(user, tenant: user.tenant)
    allow_any_instance_of(ApplicationController).to receive(:session).and_return(
      { user_id: user.id, tenant_id: tenant.id }
    )
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers, type: :request

  config.before(:each, type: :request) do
    OmniAuth.config.test_mode = true
  end
end
