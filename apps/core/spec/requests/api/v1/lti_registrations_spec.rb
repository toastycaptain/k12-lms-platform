require "rails_helper"

RSpec.describe "Api::V1::LtiRegistrations", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/lti_registrations" do
    it "returns registrations for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:lti_registration, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/lti_registrations"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/lti_registrations"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/lti_registrations" do
    it "creates a registration" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/lti_registrations", params: {
        name: "Test Tool",
        issuer: "https://tool.example.com",
        client_id: "client_123",
        auth_login_url: "https://tool.example.com/login",
        auth_token_url: "https://tool.example.com/token",
        jwks_url: "https://tool.example.com/jwks",
        deployment_id: "deploy_1"
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("Test Tool")
      expect(response.parsed_body["status"]).to eq("inactive")
    end

    it "returns 422 for invalid data" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/lti_registrations", params: { name: "" }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/lti_registrations/:id" do
    it "shows a registration" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      reg = create(:lti_registration, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/lti_registrations/#{reg.id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq(reg.name)
    end
  end

  describe "PATCH /api/v1/lti_registrations/:id" do
    it "updates a registration" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      reg = create(:lti_registration, tenant: tenant, created_by: admin)
      Current.tenant = nil

      patch "/api/v1/lti_registrations/#{reg.id}", params: { name: "Updated Name" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated Name")
    end
  end

  describe "DELETE /api/v1/lti_registrations/:id" do
    it "deletes a registration" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      reg = create(:lti_registration, tenant: tenant, created_by: admin)
      Current.tenant = nil

      delete "/api/v1/lti_registrations/#{reg.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/lti_registrations/:id/activate" do
    it "activates a registration" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      reg = create(:lti_registration, tenant: tenant, created_by: admin, status: "inactive")
      Current.tenant = nil

      post "/api/v1/lti_registrations/#{reg.id}/activate"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("active")
    end
  end

  describe "POST /api/v1/lti_registrations/:id/deactivate" do
    it "deactivates a registration" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      reg = create(:lti_registration, tenant: tenant, created_by: admin, status: "active")
      Current.tenant = nil

      post "/api/v1/lti_registrations/#{reg.id}/deactivate"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("inactive")
    end
  end
end
