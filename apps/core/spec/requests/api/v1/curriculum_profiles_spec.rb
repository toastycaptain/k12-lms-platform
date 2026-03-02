require "rails_helper"

RSpec.describe "Api::V1::CurriculumProfiles", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) { create_user_with_role("admin") }
  let(:teacher) { create_user_with_role("teacher") }
  let(:student) { create_user_with_role("student") }
  let(:guardian) { create_user_with_role("guardian") }
  let(:curriculum_lead) { create_user_with_role("curriculum_lead") }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/curriculum_profiles" do
    it "allows admins" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/curriculum_profiles"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_an(Array)
      expect(response.parsed_body).not_to be_empty
      expect(response.parsed_body.first).to include("key", "label", "version")
    end

    it "returns 403 for curriculum leads" do
      mock_session(curriculum_lead, tenant: tenant)

      get "/api/v1/curriculum_profiles"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for teachers" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/curriculum_profiles"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      get "/api/v1/curriculum_profiles"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for guardians" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/curriculum_profiles"

      expect(response).to have_http_status(:forbidden)
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
