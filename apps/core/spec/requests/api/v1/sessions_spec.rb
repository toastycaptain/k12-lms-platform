require "rails_helper"

RSpec.describe "Api::V1::Sessions", type: :request do
  let!(:tenant) { create(:tenant, slug: "example") }

  before do
    OmniAuth.config.test_mode = true
  end

  after do
    OmniAuth.config.test_mode = false
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /auth/google_oauth2/callback" do
    context "with valid OmniAuth response" do
      before do
        OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "123456789",
          info: {
            email: "teacher@example.com",
            first_name: "Jane",
            last_name: "Smith"
          }
        )
      end

      it "creates a new user and redirects" do
        expect {
          get "/auth/google_oauth2/callback"
        }.to change(User.unscoped, :count).by(1)
          .and change(AuditLog.unscoped, :count).by(1)

        expect(response).to have_http_status(:redirect)
        expect(AuditLog.unscoped.order(:id).last.event_type).to eq("session.signed_in")
      end

      it "finds existing user by provider uid identity" do
        Current.tenant = tenant
        existing_user = create(
          :user,
          email: "legacy@example.com",
          tenant: tenant,
          preferences: { "auth_identities" => { "google_oauth2" => "123456789" } }
        )
        Current.tenant = nil

        expect {
          get "/auth/google_oauth2/callback"
        }.not_to change(User.unscoped, :count)

        expect(response).to have_http_status(:redirect)
        expect(existing_user.reload.first_name).to eq("Jane")
      end

      it "finds existing user by email within tenant" do
        Current.tenant = tenant
        existing_user = create(:user, email: "teacher@example.com", tenant: tenant)
        Current.tenant = nil

        expect {
          get "/auth/google_oauth2/callback"
        }.not_to change(User.unscoped, :count)

        expect(response).to have_http_status(:redirect)
      end

      it "updates user name from Google profile" do
        Current.tenant = tenant
        existing_user = create(:user, email: "teacher@example.com", first_name: "Old", tenant: tenant)
        Current.tenant = nil

        get "/auth/google_oauth2/callback"

        existing_user.reload
        expect(existing_user.first_name).to eq("Jane")
        expect(existing_user.last_name).to eq("Smith")
      end

      it "stores Google OAuth tokens from the auth hash" do
        OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "123456789",
          info: {
            email: "teacher@example.com",
            first_name: "Jane",
            last_name: "Smith"
          },
          credentials: {
            token: "google-access-token",
            refresh_token: "google-refresh-token",
            expires_at: 1.hour.from_now.to_i
          }
        )

        get "/auth/google_oauth2/callback"

        user = User.unscoped.find_by(email: "teacher@example.com")
        expect(user.google_access_token).to eq("google-access-token")
        expect(user.google_refresh_token).to eq("google-refresh-token")
        expect(user.google_token_expires_at).to be_present
      end

      it "establishes session for subsequent /api/v1/me requests" do
        get "/auth/google_oauth2/callback"

        get "/api/v1/me"
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.dig("user", "email")).to eq("teacher@example.com")
      end
    end

    context "with failed OmniAuth response" do
      it "redirects to frontend callback with an error" do
        get "/auth/failure", params: { message: "invalid_credentials" }

        expect(response).to have_http_status(:redirect)
        expect(response.headers["Location"]).to include("/auth/callback?error=invalid_credentials")
      end
    end
  end

  describe "DELETE /api/v1/session" do
    it "clears the session and returns success" do
      Current.tenant = tenant
      user = create(:user, tenant: tenant)
      Current.tenant = nil

      mock_session(user, tenant: tenant)
      get "/api/v1/csrf"
      token = response.parsed_body["token"]

      expect {
        delete "/api/v1/session", headers: { "X-CSRF-Token" => token }
      }.to change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["message"]).to eq("Signed out successfully")
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("session.signed_out")
    end

    it "invalidates /api/v1/me after sign out" do
      OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
        provider: "google_oauth2",
        uid: "987654321",
        info: {
          email: "signout@example.com",
          first_name: "Sign",
          last_name: "Out"
        }
      )
      get "/auth/google_oauth2/callback"
      get "/api/v1/csrf"
      token = response.parsed_body["token"]

      delete "/api/v1/session", headers: { "X-CSRF-Token" => token }
      expect(response).to have_http_status(:ok)

      get "/api/v1/me"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/me" do
    context "when authenticated" do
      it "returns the current user and tenant info" do
        Current.tenant = tenant
        user = create(:user, email: "me@example.com", first_name: "John", last_name: "Doe", tenant: tenant)
        user.add_role(:teacher)
        Current.tenant = nil

        mock_session(user, tenant: tenant)

        get "/api/v1/me"

        expect(response).to have_http_status(:ok)
        body = response.parsed_body
        expect(body["user"]["email"]).to eq("me@example.com")
        expect(body["user"]["first_name"]).to eq("John")
        expect(body["user"]["roles"]).to include("teacher")
        expect(body["user"]["onboarding_complete"]).to be(false)
        expect(body["user"]["preferences"]).to eq({})
        expect(body["tenant"]["name"]).to eq(tenant.name)
      end

      it "returns google_connected as false when no refresh token" do
        Current.tenant = tenant
        user = create(:user, email: "nogoogle@example.com", tenant: tenant)
        Current.tenant = nil

        mock_session(user, tenant: tenant)

        get "/api/v1/me"

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["user"]["google_connected"]).to be false
      end

      it "returns google_connected as true when refresh token is present" do
        Current.tenant = tenant
        user = create(:user, email: "hasgoogle@example.com", tenant: tenant,
          google_refresh_token: "some-refresh-token")
        Current.tenant = nil

        mock_session(user, tenant: tenant)

        get "/api/v1/me"

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["user"]["google_connected"]).to be true
      end
    end

    context "when not authenticated" do
      it "returns 401 unauthorized" do
        get "/api/v1/me"

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to eq("Unauthorized")
      end
    end
  end

  describe "PATCH /api/v1/me" do
    it "updates onboarding and preferences for the current user" do
      Current.tenant = tenant
      user = create(:user, tenant: tenant)
      Current.tenant = nil
      mock_session(user, tenant: tenant)
      get "/api/v1/csrf"
      token = response.parsed_body["token"]

      patch "/api/v1/me", params: {
        onboarding_complete: true,
        preferences: { subjects: [ "Math" ], grade_levels: [ "6" ] }
      }, headers: { "X-CSRF-Token" => token }

      expect(response).to have_http_status(:ok)
      user.reload
      expect(user.onboarding_complete).to be(true)
      expect(user.preferences).to eq({ "subjects" => [ "Math" ], "grade_levels" => [ "6" ] })
    end
  end
end
