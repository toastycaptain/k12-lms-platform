require "rails_helper"
require "webmock/rspec"

RSpec.describe "Api::V1::IntegrationConfigs OneRoster", type: :request do
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

  describe "POST /api/v1/integration_configs (oneroster)" do
    it "creates an oneroster config as admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/integration_configs", params: {
        provider: "oneroster",
        settings: {
          base_url: "https://oneroster.example.com",
          client_id: "cid",
          client_secret: "csecret",
          auto_sync_enabled: false,
          sync_interval_hours: 24
        }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["provider"]).to eq("oneroster")
      expect(response.parsed_body["settings"]["base_url"]).to eq("https://oneroster.example.com")
    end
  end

  describe "POST /api/v1/integration_configs/:id/test_connection" do
    let(:memory_store) { ActiveSupport::Cache::MemoryStore.new }

    before do
      allow(Rails).to receive(:cache).and_return(memory_store)
    end

    it "tests connection successfully" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      stub_request(:post, "https://oneroster.example.com/token")
        .to_return(
          status: 200,
          body: { access_token: "abc123", expires_in: 3600 }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      stub_request(:get, "https://oneroster.example.com/ims/oneroster/v1p1/orgs")
        .with(query: { limit: 1, offset: 0 })
        .to_return(
          status: 200,
          body: { orgs: [ { sourcedId: "org-1", name: "Test School" } ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      post "/api/v1/integration_configs/#{config.id}/test_connection"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("ok")
      expect(response.parsed_body["org_count"]).to eq(1)
    end

    it "returns error status on connection failure" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      stub_request(:post, "https://oneroster.example.com/token")
        .to_return(
          status: 401,
          body: { error: "invalid_client" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      post "/api/v1/integration_configs/#{config.id}/test_connection"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("error")
      expect(response.parsed_body["message"]).to be_present
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/test_connection"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/integration_configs/:id/sync_orgs" do
    it "triggers org sync for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/sync_orgs"

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["message"]).to eq("Org sync triggered")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/sync_orgs"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/integration_configs/:id/sync_users" do
    it "triggers user sync for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/sync_users"

      expect(response).to have_http_status(:accepted)
    end
  end

  describe "POST /api/v1/integration_configs/:id/sync_classes" do
    it "triggers class sync for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/sync_classes"

      expect(response).to have_http_status(:accepted)
    end
  end

  describe "POST /api/v1/integration_configs/:id/sync_enrollments" do
    it "triggers enrollment sync for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/integration_configs/#{config.id}/sync_enrollments"

      expect(response).to have_http_status(:accepted)
    end
  end
end
