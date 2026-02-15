require "rails_helper"

RSpec.describe "Api::V1::DataRetentionPolicies", type: :request do
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
      data_retention_policy: {
        name: "Delete Old Logs",
        entity_type: "AuditLog",
        action: "delete",
        retention_days: 60,
        enabled: true,
        settings: {}
      }
    }
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/data_retention_policies" do
    it "returns policies for admins" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:data_retention_policy, tenant: tenant, created_by: admin, name: "A")
      create(:data_retention_policy, tenant: tenant, created_by: admin, name: "B")
      Current.tenant = nil

      get "/api/v1/data_retention_policies"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["name"] }).to include("A", "B")
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/data_retention_policies"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/data_retention_policies" do
    it "creates a policy for admins" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/data_retention_policies", params: base_params
      }.to change(DataRetentionPolicy.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["entity_type"]).to eq("AuditLog")
      expect(response.parsed_body["retention_days"]).to eq(60)
    end
  end

  describe "POST /api/v1/data_retention_policies/:id/enforce" do
    it "enqueues the enforcement job" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      policy = create(:data_retention_policy, tenant: tenant, created_by: admin)
      Current.tenant = nil

      expect {
        post "/api/v1/data_retention_policies/#{policy.id}/enforce"
      }.to have_enqueued_job(DataRetentionEnforcementJob).with(policy.id)

      expect(response).to have_http_status(:accepted)
    end
  end
end
