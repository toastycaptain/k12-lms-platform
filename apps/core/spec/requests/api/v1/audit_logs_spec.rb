require "rails_helper"

RSpec.describe "Api::V1::AuditLogs", type: :request do
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

  describe "GET /api/v1/audit_logs" do
    it "returns recent logs for privileged users" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      older = create(:audit_log, tenant: tenant, actor: admin, event_type: "event.old", created_at: 2.days.ago)
      newer = create(:audit_log, tenant: tenant, actor: admin, event_type: "event.new", created_at: 1.day.ago)
      Current.tenant = nil

      get "/api/v1/audit_logs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first["id"]).to eq(newer.id)
      expect(response.parsed_body.last["id"]).to eq(older.id)
    end

    it "applies a caller-provided limit" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      3.times { create(:audit_log, tenant: tenant, actor: admin) }
      Current.tenant = nil

      get "/api/v1/audit_logs", params: { limit: 2 }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns 403 for non-privileged users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/audit_logs"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 401 when unauthenticated" do
      get "/api/v1/audit_logs"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
