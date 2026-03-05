require "rails_helper"

RSpec.describe "Api::V1::Admin::CurriculumSettings lifecycle", type: :request do
  let!(:tenant) { create(:tenant, settings: { "curriculum_default_profile_key" => "american_common_core_v1" }) }
  let!(:academic_year) { create(:academic_year, tenant: tenant) }
  let!(:school) { create(:school, tenant: tenant, name: "North Campus") }
  let!(:course) { create(:course, tenant: tenant, academic_year: academic_year, school: school) }
  let(:admin) { create_user_with_role("admin") }

  before do
    CurriculumProfileRegistry.reset!
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/admin/curriculum_settings/import" do
    it "validates payloads and returns schema errors" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/curriculum_settings/import", params: {
        operation: "validate",
        payload: { foo: "bar" }
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["valid"]).to eq(false)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "imports and publishes lifecycle releases" do
      mock_session(admin, tenant: tenant)

      payload = {
        identity: {
          key: "custom_profile_v2",
          label: "Custom Profile",
          description: "Custom profile",
          jurisdiction: "US"
        },
        versioning: {
          version: "2026.2",
          compatibility: "v2_only"
        },
        terminology: {
          subject_label: "Subject",
          grade_label: "Grade",
          unit_label: "Unit"
        },
        navigation: {
          admin: [ "plan", "admin" ]
        },
        planner_object_schemas: { unit_plan: { fields: [] } },
        workflow_bindings: { unit_plan: "unit_plan_default_v1" },
        report_bindings: { standards_coverage: { default_frameworks: [] } },
        capability_modules: { portfolio: true },
        integration_hints: { lti_context_tag: "custom" },
        status: "active"
      }

      post "/api/v1/admin/curriculum_settings/import", params: {
        operation: "import",
        payload: payload
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["status"]).to eq("draft")

      post "/api/v1/admin/curriculum_settings/import", params: {
        operation: "publish",
        profile_key: "custom_profile_v2",
        profile_version: "2026.2"
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
      expect(tenant.reload.settings["curriculum_default_profile_key"]).to eq("custom_profile_v2")
      expect(tenant.settings["curriculum_default_profile_version"]).to eq("2026.2")
    end
  end

  describe "PUT /api/v1/admin/curriculum_settings" do
    it "applies course pins and academic year freezes" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/curriculum_settings", params: {
        course_pins: [
          {
            course_id: course.id,
            curriculum_profile_key: "ib_continuum_v1",
            curriculum_profile_version: "2026.1"
          }
        ],
        academic_year_freezes: [
          {
            academic_year_id: academic_year.id,
            curriculum_profile_key: "ib_continuum_v1",
            curriculum_profile_version: "2026.1",
            frozen: true
          }
        ]
      }

      expect(response).to have_http_status(:ok)
      expect(
        CurriculumProfileAssignment.where(tenant_id: tenant.id, scope_type: "course", course_id: course.id, active: true).count
      ).to eq(1)
      expect(
        CurriculumProfileAssignment.where(tenant_id: tenant.id, scope_type: "academic_year", academic_year_id: academic_year.id, is_frozen: true, active: true).count
      ).to eq(1)

      get "/api/v1/admin/curriculum_settings", params: { course_id: course.id }

      expect(response).to have_http_status(:ok)
      diagnostics = response.parsed_body["diagnostics"]
      expect(diagnostics).to be_present
      expect(diagnostics.dig("effective", "resolution_trace_id")).to be_present
    end

    it "resolves unresolved course-school mapping issues" do
      mock_session(admin, tenant: tenant)
      second_school = create(:school, tenant: tenant, name: "South Campus")
      unresolved_course = create(:course, tenant: tenant, academic_year: academic_year, school: nil)

      get "/api/v1/admin/curriculum_settings"
      expect(response).to have_http_status(:ok)

      issue = CurriculumCourseMappingIssue.find_by!(tenant_id: tenant.id, course_id: unresolved_course.id)

      put "/api/v1/admin/curriculum_settings", params: {
        course_mapping_resolutions: [
          {
            issue_id: issue.id,
            school_id: second_school.id
          }
        ]
      }

      expect(response).to have_http_status(:ok)
      expect(unresolved_course.reload.school_id).to eq(second_school.id)
      expect(issue.reload.status).to eq("resolved")
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
