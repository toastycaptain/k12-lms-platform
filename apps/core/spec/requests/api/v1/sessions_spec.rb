require "rails_helper"

RSpec.describe "Api::V1::Sessions", type: :request do
  let!(:tenant) { create(:tenant) }

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

        expect(response).to have_http_status(:redirect)
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
    end

    context "with failed OmniAuth response" do
      it "returns failure message" do
        get "/auth/failure", params: { message: "invalid_credentials" }

        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to include("invalid_credentials")
      end
    end
  end

  describe "DELETE /api/v1/session" do
    it "clears the session and returns success" do
      Current.tenant = tenant
      user = create(:user, tenant: tenant)
      Current.tenant = nil

      mock_session(user, tenant: tenant)

      delete "/api/v1/session"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["message"]).to eq("Signed out successfully")
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
end
