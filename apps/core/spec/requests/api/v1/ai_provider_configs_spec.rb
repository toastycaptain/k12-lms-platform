require "rails_helper"

RSpec.describe "Api::V1::AiProviderConfigs", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/ai_provider_configs" do
    it "returns configs for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/ai_provider_configs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/ai_provider_configs"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/ai_provider_configs" do
    it "creates a config as admin and does not return api_key" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/ai_provider_configs", params: {
          provider_name: "openai",
          display_name: "OpenAI",
          api_key: "sk-secret-key-123",
          default_model: "gpt-4o",
          available_models: [ "gpt-4o", "gpt-4o-mini" ],
          settings: { max_retries: 3 }
        }
      }.to change(AiProviderConfig.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["provider_name"]).to eq("openai")
      expect(response.parsed_body).not_to have_key("api_key")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/ai_provider_configs", params: {
        provider_name: "openai",
        display_name: "OpenAI",
        default_model: "gpt-4o"
      }

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects duplicate provider per tenant" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_provider_config, tenant: tenant, created_by: admin, provider_name: "openai")
      Current.tenant = nil

      post "/api/v1/ai_provider_configs", params: {
        provider_name: "openai",
        display_name: "Another OpenAI",
        default_model: "gpt-4o"
      }

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/ai_provider_configs/:id" do
    it "shows a config without api_key" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/ai_provider_configs/#{config.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(config.id)
      expect(response.parsed_body).not_to have_key("api_key")
    end
  end

  describe "PATCH /api/v1/ai_provider_configs/:id" do
    it "updates a config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      patch "/api/v1/ai_provider_configs/#{config.id}", params: {
        display_name: "Updated OpenAI"
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["display_name"]).to eq("Updated OpenAI")
    end
  end

  describe "DELETE /api/v1/ai_provider_configs/:id" do
    it "deletes a config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      expect {
        delete "/api/v1/ai_provider_configs/#{config.id}"
      }.to change(AiProviderConfig.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/ai_provider_configs/:id/activate" do
    it "activates a config with api_key" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin, api_key: "sk-test-key")
      Current.tenant = nil

      post "/api/v1/ai_provider_configs/#{config.id}/activate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("active")
    end

    it "returns 422 when activating without api_key" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin, api_key: nil)
      Current.tenant = nil

      post "/api/v1/ai_provider_configs/#{config.id}/activate"

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "POST /api/v1/ai_provider_configs/:id/deactivate" do
    it "deactivates an active config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin, status: "active", api_key: "sk-test-key")
      Current.tenant = nil

      post "/api/v1/ai_provider_configs/#{config.id}/deactivate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("inactive")
    end
  end
end
