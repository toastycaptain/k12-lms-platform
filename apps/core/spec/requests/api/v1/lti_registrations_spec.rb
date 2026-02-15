require "rails_helper"

RSpec.describe "Api::V1::LtiRegistrations", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:base_params) do
    {
      lti_registration: {
        name: "District LTI Tool",
        issuer: "https://issuer.example.com",
        client_id: "client-123",
        deployment_id: "dep-123",
        auth_login_url: "https://tool.example.com/auth/login",
        auth_token_url: "https://tool.example.com/auth/token",
        jwks_url: "https://tool.example.com/.well-known/jwks.json",
        description: "District tool",
        settings: { launch_presentation_locale: "en-US" }
      }
    }
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/lti_registrations" do
    it "returns registrations for admin users" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:lti_registration, tenant: tenant, created_by: admin, name: "One")
      create(:lti_registration, tenant: tenant, created_by: admin, name: "Two")
      Current.tenant = nil

      get "/api/v1/lti_registrations"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["name"] }).to include("One", "Two")
    end

    it "returns forbidden for teacher users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/lti_registrations"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/lti_registrations" do
    it "creates a registration for admins" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/lti_registrations", params: base_params
      }.to change(LtiRegistration.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("District LTI Tool")
      expect(response.parsed_body["status"]).to eq("inactive")
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/lti_registrations", params: base_params

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/lti_registrations/:id/activate" do
    it "activates a registration" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      registration = create(:lti_registration, tenant: tenant, created_by: admin, status: "inactive")
      Current.tenant = nil

      post "/api/v1/lti_registrations/#{registration.id}/activate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("active")
      expect(registration.reload.status).to eq("active")
    end
  end

  describe "POST /api/v1/lti_registrations/:id/deactivate" do
    it "deactivates a registration" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      registration = create(:lti_registration, tenant: tenant, created_by: admin, status: "active")
      Current.tenant = nil

      post "/api/v1/lti_registrations/#{registration.id}/deactivate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("inactive")
      expect(registration.reload.status).to eq("inactive")
    end
  end
end
