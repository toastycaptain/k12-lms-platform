require "rails_helper"

RSpec.describe "Api::V1::Permissions", type: :request do
  let(:tenant) { create(:tenant) }

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

  let(:teacher_role) { create(:role, tenant: tenant, name: "student") }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/permissions" do
    it "returns permissions for admins" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      permission = create(:permission, tenant: tenant, role: teacher_role)
      Current.tenant = nil

      get "/api/v1/permissions"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to include(permission.id)
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/permissions"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/permissions" do
    it "creates a permission as admin" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/permissions", params: {
          role_id: teacher_role.id,
          resource: "courses",
          action: "read",
          granted: true
        }
      }.to change(Permission.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["resource"]).to eq("courses")
      expect(response.parsed_body["granted"]).to eq(true)
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/permissions", params: {
        role_id: teacher_role.id,
        resource: "courses",
        action: "read",
        granted: true
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/permissions/:id" do
    it "updates permission as admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      permission = create(:permission, tenant: tenant, role: teacher_role, granted: false)
      Current.tenant = nil

      patch "/api/v1/permissions/#{permission.id}", params: { granted: true }

      expect(response).to have_http_status(:ok)
      expect(permission.reload.granted).to eq(true)
    end
  end

  describe "DELETE /api/v1/permissions/:id" do
    it "deletes permission as admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      permission = create(:permission, tenant: tenant, role: teacher_role)
      Current.tenant = nil

      expect {
        delete "/api/v1/permissions/#{permission.id}"
      }.to change(Permission.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
