require "rails_helper"

RSpec.describe "Api::V1::Roles", type: :request do
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

  describe "GET /api/v1/roles" do
    it "returns roles for admins" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:role, tenant: tenant, name: "instructional_coach")
      Current.tenant = nil

      get "/api/v1/roles"

      expect(response).to have_http_status(:ok)
      names = response.parsed_body.map { |row| row["name"] }
      expect(names).to include("instructional_coach")
    end

    it "forbids non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/roles"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/roles" do
    it "creates a custom role for admins" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/roles", params: { role: { name: "data_export_manager" } }
      }.to change(Role.unscoped.where(tenant_id: tenant.id), :count).by(1)
        .and change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("data_export_manager")
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("role.created")
    end
  end
end
