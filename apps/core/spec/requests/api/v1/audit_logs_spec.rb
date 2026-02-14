require "rails_helper"

RSpec.describe "Api::V1::AuditLogs", type: :request do
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

  describe "GET /api/v1/audit_logs" do
    it "returns audit logs for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:audit_log, tenant: tenant, user: admin, action: "create")
      create(:audit_log, tenant: tenant, user: admin, action: "update")
      Current.tenant = nil

      get "/api/v1/audit_logs"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["audit_logs"].length).to eq(2)
      expect(response.parsed_body["meta"]["total"]).to eq(2)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/audit_logs"
      expect(response).to have_http_status(:forbidden)
    end

    it "filters by action" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:audit_log, tenant: tenant, user: admin, action: "create")
      create(:audit_log, tenant: tenant, user: admin, action: "update")
      Current.tenant = nil

      get "/api/v1/audit_logs", params: { action_filter: "create" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["audit_logs"].length).to eq(1)
    end

    it "filters by user_id" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      other_user = create(:user, tenant: tenant)
      create(:audit_log, tenant: tenant, user: admin, action: "create")
      create(:audit_log, tenant: tenant, user: other_user, action: "create")
      Current.tenant = nil

      get "/api/v1/audit_logs", params: { user_id: admin.id }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["audit_logs"].length).to eq(1)
    end

    it "paginates results" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      3.times { create(:audit_log, tenant: tenant, user: admin, action: "create") }
      Current.tenant = nil

      get "/api/v1/audit_logs", params: { per_page: 2, page: 1 }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["audit_logs"].length).to eq(2)
      expect(response.parsed_body["meta"]["total"]).to eq(3)
    end
  end

  describe "GET /api/v1/audit_logs/summary" do
    it "returns summary for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:audit_log, tenant: tenant, user: admin, action: "create")
      create(:audit_log, tenant: tenant, user: admin, action: "update")
      Current.tenant = nil

      get "/api/v1/audit_logs/summary"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("by_action")
      expect(response.parsed_body).to have_key("by_day")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/audit_logs/summary"
      expect(response).to have_http_status(:forbidden)
    end
  end
end
