require "rails_helper"

RSpec.describe "Api::V1::Mobile::Sessions", type: :request do
  let(:tenant) { create(:tenant, slug: "mobile-tenant") }

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/mobile/sessions" do
    it "issues access and refresh tokens for authenticated users" do
      mock_session(student, tenant: tenant)
      get "/api/v1/csrf"
      csrf = response.parsed_body["token"]

      post "/api/v1/mobile/sessions",
        headers: {
          "X-CSRF-Token" => csrf,
          "X-Tenant-Slug" => tenant.slug
        }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["access_token"]).to be_present
      expect(response.parsed_body["refresh_token"]).to be_present
      expect(response.parsed_body["token_type"]).to eq("Bearer")
    end

    it "requires tenant slug header" do
      mock_session(student, tenant: tenant)
      get "/api/v1/csrf"
      csrf = response.parsed_body["token"]

      post "/api/v1/mobile/sessions", headers: { "X-CSRF-Token" => csrf }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to eq("X-Tenant-Slug header is required")
    end
  end

  describe "POST /api/v1/mobile/refresh" do
    it "rotates refresh token and issues a new access token" do
      mock_session(student, tenant: tenant)
      get "/api/v1/csrf"
      csrf = response.parsed_body["token"]
      post "/api/v1/mobile/sessions",
        headers: {
          "X-CSRF-Token" => csrf,
          "X-Tenant-Slug" => tenant.slug
        }

      old_refresh_token = response.parsed_body["refresh_token"]

      post "/api/v1/mobile/refresh",
        params: { refresh_token: old_refresh_token },
        headers: { "X-Tenant-Slug" => tenant.slug }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["access_token"]).to be_present
      expect(response.parsed_body["refresh_token"]).to be_present
      expect(response.parsed_body["refresh_token"]).not_to eq(old_refresh_token)
    end

    it "rejects invalid refresh tokens" do
      post "/api/v1/mobile/refresh",
        params: { refresh_token: "invalid" },
        headers: { "X-Tenant-Slug" => tenant.slug }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/mobile/session" do
    it "revokes an active mobile session" do
      mock_session(student, tenant: tenant)
      get "/api/v1/csrf"
      csrf = response.parsed_body["token"]
      post "/api/v1/mobile/sessions",
        headers: {
          "X-CSRF-Token" => csrf,
          "X-Tenant-Slug" => tenant.slug
        }

      refresh_token = response.parsed_body["refresh_token"]

      delete "/api/v1/mobile/session",
        params: { refresh_token: refresh_token },
        headers: { "X-Tenant-Slug" => tenant.slug }

      expect(response).to have_http_status(:ok)

      post "/api/v1/mobile/refresh",
        params: { refresh_token: refresh_token },
        headers: { "X-Tenant-Slug" => tenant.slug }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "Bearer token authentication" do
    it "authenticates /api/v1/me with access token" do
      mock_session(student, tenant: tenant)
      get "/api/v1/csrf"
      csrf = response.parsed_body["token"]
      post "/api/v1/mobile/sessions",
        headers: {
          "X-CSRF-Token" => csrf,
          "X-Tenant-Slug" => tenant.slug
        }

      access_token = response.parsed_body["access_token"]

      get "/api/v1/me", headers: { "Authorization" => "Bearer #{access_token}" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "id")).to eq(student.id)
      expect(response.parsed_body.dig("tenant", "id")).to eq(tenant.id)
    end
  end
end
