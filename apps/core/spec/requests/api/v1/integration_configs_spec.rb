require "rails_helper"

RSpec.describe "Api::V1::IntegrationConfigs", type: :request do
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
  let(:curriculum_lead) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:curriculum_lead)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/integration_configs" do
    it "returns configs for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:integration_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/integration_configs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/integration_configs"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for curriculum lead" do
      mock_session(curriculum_lead, tenant: tenant)

      get "/api/v1/integration_configs"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/integration_configs" do
    it "creates a config as admin" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/integration_configs", params: {
          provider: "google_classroom",
          settings: { classroom_enabled: true, domain: "test.edu" }
        }
      }.to change(IntegrationConfig.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["provider"]).to eq("google_classroom")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/integration_configs", params: { provider: "google_classroom" }

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects duplicate provider per tenant" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:integration_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/integration_configs", params: { provider: "google_classroom" }

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/integration_configs/:id" do
    it "shows a config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/integration_configs/#{config.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(config.id)
    end
  end

  describe "PATCH /api/v1/integration_configs/:id" do
    it "updates settings" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      patch "/api/v1/integration_configs/#{config.id}", params: {
        settings: { domain: "updated.edu" }
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["settings"]["domain"]).to eq("updated.edu")
    end
  end

  describe "DELETE /api/v1/integration_configs/:id" do
    it "deletes a config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      expect {
        delete "/api/v1/integration_configs/#{config.id}"
      }.to change(IntegrationConfig.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/integration_configs/:id/activate" do
    it "activates a config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, tenant: tenant, created_by: admin, status: "inactive")
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/activate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("active")
    end
  end

  describe "POST /api/v1/integration_configs/:id/deactivate" do
    it "deactivates an active config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, tenant: tenant, created_by: admin, status: "active")
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/deactivate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("inactive")
    end
  end
end
