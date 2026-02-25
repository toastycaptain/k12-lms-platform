require "rails_helper"

RSpec.describe "Api::V1::Admin::Provisioning", type: :request do
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

  describe "POST /api/v1/admin/provisioning/create_school" do
    it "creates a new school for admin users" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/provisioning/create_school", params: {
        school: {
          school_name: "New Academy",
          subdomain: "new-academy",
          admin_email: "admin@newacademy.edu",
          admin_first_name: "Jane",
          admin_last_name: "Doe"
        }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["tenant_slug"]).to eq("new-academy")
      expect(response.parsed_body["admin_email"]).to eq("admin@newacademy.edu")
      expect(response.parsed_body["setup_token"]).to be_present
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/admin/provisioning/create_school", params: { school: { school_name: "Test" } }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/admin/provisioning/checklist/:tenant_id" do
    it "returns onboarding checklist" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/provisioning/checklist/#{tenant.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["items"]).to be_an(Array)
      expect(response.parsed_body["completion_percentage"]).to be_a(Integer)
    end
  end

  describe "GET /api/v1/admin/provisioning/tenants" do
    it "returns tenants with onboarding status" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/provisioning/tenants"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_an(Array)
    end
  end

  describe "POST /api/v1/admin/provisioning/import/:tenant_id" do
    it "imports users from CSV" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/provisioning/import/#{tenant.id}", params: {
        import_type: "users",
        csv_content: "email,first_name,last_name,role\ntest@school.edu,Test,User,teacher\n"
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["created"]).to eq(1)
    end
  end
end
