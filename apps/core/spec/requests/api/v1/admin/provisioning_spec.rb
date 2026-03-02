require "rails_helper"

RSpec.describe "Api::V1::Admin::Provisioning", type: :request do
  let!(:district) { create(:district) }
  let!(:tenant) { create(:tenant, district: district) }
  let!(:outside_tenant) { create(:tenant, district: create(:district)) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:district_admin) { create(:user, tenant: tenant, district_admin: true) }
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

    it "accepts an initial tenant curriculum default profile for admin users" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/provisioning/create_school", params: {
        school: {
          school_name: "Curriculum Academy",
          subdomain: "curriculum-academy",
          admin_email: "admin@curriculumacademy.edu",
          admin_first_name: "Alex",
          admin_last_name: "Admin",
          curriculum_default_profile_key: "ib_continuum_v1"
        }
      }

      expect(response).to have_http_status(:created)
      created_tenant = Tenant.unscoped.find(response.parsed_body["tenant_id"])
      expect(created_tenant.settings["curriculum_default_profile_key"]).to eq("ib_continuum_v1")
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/admin/provisioning/create_school", params: { school: { school_name: "Test" } }

      expect(response).to have_http_status(:forbidden)
    end

    it "forces district scoping for delegated district admins" do
      mock_session(district_admin, tenant: tenant)

      post "/api/v1/admin/provisioning/create_school", params: {
        school: {
          school_name: "District Scoped School",
          subdomain: "district-scoped-school",
          admin_email: "admin@districtscoped.edu",
          admin_first_name: "Dina",
          admin_last_name: "Scoped",
          district_id: outside_tenant.district_id
        }
      }

      expect(response).to have_http_status(:created)
      created_tenant = Tenant.unscoped.find(response.parsed_body["tenant_id"])
      expect(created_tenant.district_id).to eq(district.id)
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

    it "returns not found for district admin outside of district scope" do
      mock_session(district_admin, tenant: tenant)

      get "/api/v1/admin/provisioning/checklist/#{outside_tenant.id}"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/admin/provisioning/tenants" do
    it "returns tenants with onboarding status" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/provisioning/tenants"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_an(Array)
    end

    it "returns only same-district tenants for district admins" do
      mock_session(district_admin, tenant: tenant)

      get "/api/v1/admin/provisioning/tenants"

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body.map { |row| row["id"] }
      expect(ids).to include(tenant.id)
      expect(ids).not_to include(outside_tenant.id)
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

    it "returns not found for district admin outside of district scope" do
      mock_session(district_admin, tenant: tenant)

      post "/api/v1/admin/provisioning/import/#{outside_tenant.id}", params: {
        import_type: "users",
        csv_content: "email,first_name,last_name,role\ntest@school.edu,Test,User,teacher\n"
      }

      expect(response).to have_http_status(:not_found)
    end
  end
end
