require "rails_helper"

RSpec.describe "Api::V1::AiProviderConfigs", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/ai_provider_configs" do
    it "lists configs for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/ai_provider_configs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "denies access for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/ai_provider_configs"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/ai_provider_configs" do
    it "creates a config as admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/ai_provider_configs", params: {
        provider_name: "anthropic",
        display_name: "Claude",
        default_model: "claude-sonnet-4-5-20250929",
        api_key: "sk-test-key"
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["provider_name"]).to eq("anthropic")
    end
  end

  describe "POST /api/v1/ai_provider_configs/:id/activate" do
    it "activates a config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin, status: "inactive")
      Current.tenant = nil

      post "/api/v1/ai_provider_configs/#{config.id}/activate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("active")
    end
  end
end
