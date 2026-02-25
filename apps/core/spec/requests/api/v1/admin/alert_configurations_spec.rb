require "rails_helper"

RSpec.describe "Api::V1::Admin::AlertConfigurations", type: :request do
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

  after { Current.tenant = nil }

  describe "GET /api/v1/admin/alert_configurations" do
    it "returns alert configurations for admins" do
      mock_session(admin, tenant: tenant)
      AlertConfiguration.create!(
        name: "Pool High",
        metric: "db_connection_pool",
        comparison: "gt",
        threshold: 80,
        severity: "warning",
        notification_channel: "slack"
      )

      get "/api/v1/admin/alert_configurations"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/admin/alert_configurations"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/admin/alert_configurations" do
    it "creates a new alert configuration" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/alert_configurations", params: {
        alert_configuration: {
          name: "High Memory",
          metric: "memory_usage_percent",
          comparison: "gt",
          threshold: 90,
          severity: "critical",
          notification_channel: "slack"
        }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("High Memory")
    end
  end
end
