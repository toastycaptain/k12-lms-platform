require "rails_helper"

RSpec.describe "Api::V1::Admin::CurriculumSettings", type: :request do
  let!(:tenant) { create(:tenant, settings: { "curriculum_default_profile_key" => "american_common_core_v1" }) }
  let!(:school) { create(:school, tenant: tenant, name: "North Campus") }

  let(:admin) { create_user_with_role("admin") }
  let(:curriculum_lead) { create_user_with_role("curriculum_lead") }
  let(:teacher) { create_user_with_role("teacher") }
  let(:student) { create_user_with_role("student") }
  let(:guardian) { create_user_with_role("guardian") }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/admin/curriculum_settings" do
    it "allows admin users" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/curriculum_settings"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["tenant_default_profile_key"]).to eq("american_common_core_v1")
      expect(response.parsed_body["school_overrides"]).to be_an(Array)
      expect(response.parsed_body["school_overrides"].first["school_id"]).to eq(school.id)
    end

    it "returns 403 for curriculum leads" do
      mock_session(curriculum_lead, tenant: tenant)

      get "/api/v1/admin/curriculum_settings"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for teacher/student/guardian" do
      [ teacher, student, guardian ].each do |user|
        mock_session(user, tenant: tenant)
        get "/api/v1/admin/curriculum_settings"
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PUT /api/v1/admin/curriculum_settings" do
    it "allows admin to update tenant default and school override" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/curriculum_settings", params: {
        tenant_default_profile_key: "ib_continuum_v1",
        school_overrides: [
          { school_id: school.id, curriculum_profile_key: "british_cambridge_v1" }
        ]
      }

      expect(response).to have_http_status(:ok)
      tenant.reload
      school.reload

      expect(tenant.settings["curriculum_default_profile_key"]).to eq("ib_continuum_v1")
      expect(school.curriculum_profile_key).to eq("british_cambridge_v1")
    end

    it "returns 422 for invalid profile keys" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/curriculum_settings", params: {
        tenant_default_profile_key: "invalid-profile-key"
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to include("Invalid tenant_default_profile_key")
    end

    it "returns 403 for curriculum leads" do
      mock_session(curriculum_lead, tenant: tenant)

      put "/api/v1/admin/curriculum_settings", params: { tenant_default_profile_key: "ib_continuum_v1" }

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for teacher/student/guardian" do
      [ teacher, student, guardian ].each do |user|
        mock_session(user, tenant: tenant)
        put "/api/v1/admin/curriculum_settings", params: { tenant_default_profile_key: "ib_continuum_v1" }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/admin/curriculum_settings/import" do
    it "returns not implemented for admin while preserving admin-only policy" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/curriculum_settings/import", params: { payload: { version: "draft" } }

      expect(response).to have_http_status(:not_implemented)
    end

    it "returns 403 for non-admin roles" do
      [ teacher, student, guardian, curriculum_lead ].each do |user|
        mock_session(user, tenant: tenant)
        post "/api/v1/admin/curriculum_settings/import", params: { payload: { version: "draft" } }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  def create_user_with_role(role_name)
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(role_name)
    Current.tenant = nil
    user
  end
end
