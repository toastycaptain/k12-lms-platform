require "rails_helper"

RSpec.describe "Api::V1::DataRetentionPolicies", type: :request do
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

  describe "GET /api/v1/data_retention_policies" do
    it "returns policies for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:data_retention_policy, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/data_retention_policies"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/data_retention_policies"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/data_retention_policies" do
    it "creates a policy" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/data_retention_policies", params: {
        name: "Audit Log Cleanup",
        entity_type: "audit_log",
        retention_days: 90,
        policy_action: "delete"
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("Audit Log Cleanup")
    end

    it "returns 422 for retention_days < 30" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/data_retention_policies", params: {
        name: "Too Short",
        entity_type: "audit_log",
        retention_days: 15,
        policy_action: "delete"
      }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PATCH /api/v1/data_retention_policies/:id" do
    it "updates a policy" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      policy = create(:data_retention_policy, tenant: tenant, created_by: admin)
      Current.tenant = nil

      patch "/api/v1/data_retention_policies/#{policy.id}", params: { retention_days: 180 }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["retention_days"]).to eq(180)
    end
  end

  describe "DELETE /api/v1/data_retention_policies/:id" do
    it "deletes a policy" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      policy = create(:data_retention_policy, tenant: tenant, created_by: admin)
      Current.tenant = nil

      delete "/api/v1/data_retention_policies/#{policy.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/data_retention_policies/:id/run" do
    it "enqueues the enforcement job" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      policy = create(:data_retention_policy, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/data_retention_policies/#{policy.id}/run"
      expect(response).to have_http_status(:accepted)
    end
  end
end
