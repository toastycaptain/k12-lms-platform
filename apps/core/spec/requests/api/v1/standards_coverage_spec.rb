require "rails_helper"

RSpec.describe "Api::V1::StandardsCoverage", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:curriculum_lead) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:curriculum_lead)
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/courses/:id/standards_coverage" do
    it "returns standards coverage for a course" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant

      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      framework = create(:standard_framework, tenant: tenant)
      std1 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.1")
      std2 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.2")
      std3 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.3")

      # Unit 1 covers std1 and std2
      up1 = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "draft")
      v1 = up1.create_version!(title: "v1")
      UnitVersionStandard.create!(tenant: tenant, unit_version: v1, standard: std1)
      UnitVersionStandard.create!(tenant: tenant, unit_version: v1, standard: std2)

      # Unit 2 (published) covers std2
      up2 = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "published")
      v2 = up2.create_version!(title: "v1")
      UnitVersionStandard.create!(tenant: tenant, unit_version: v2, standard: std2)

      # Archived unit should be excluded
      up3 = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "archived")
      v3 = up3.create_version!(title: "v1")
      UnitVersionStandard.create!(tenant: tenant, unit_version: v3, standard: std3)

      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/standards_coverage",
          params: { standard_framework_id: framework.id }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.length).to eq(3)

      std1_data = body.find { |s| s["code"] == "CCSS.1" }
      expect(std1_data["covered"]).to be true
      expect(std1_data["unit_plan_ids"]).to contain_exactly(up1.id)

      std2_data = body.find { |s| s["code"] == "CCSS.2" }
      expect(std2_data["covered"]).to be true
      expect(std2_data["unit_plan_ids"]).to contain_exactly(up1.id, up2.id)

      std3_data = body.find { |s| s["code"] == "CCSS.3" }
      expect(std3_data["covered"]).to be false
      expect(std3_data["unit_plan_ids"]).to be_empty
    end

    it "requires standard_framework_id param" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/standards_coverage"

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "GET /api/v1/academic_years/:id/standards_coverage" do
    it "returns standards coverage across all courses in the academic year" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant

      ay = create(:academic_year, tenant: tenant)
      course1 = create(:course, tenant: tenant, academic_year: ay)
      course2 = create(:course, tenant: tenant, academic_year: ay)
      framework = create(:standard_framework, tenant: tenant)
      std1 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.1")
      std2 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.2")

      # Course 1 unit covers std1
      up1 = create(:unit_plan, tenant: tenant, course: course1, created_by: teacher, status: "draft")
      v1 = up1.create_version!(title: "v1")
      UnitVersionStandard.create!(tenant: tenant, unit_version: v1, standard: std1)

      # Course 2 unit covers std1 and std2
      up2 = create(:unit_plan, tenant: tenant, course: course2, created_by: teacher, status: "published")
      v2 = up2.create_version!(title: "v1")
      UnitVersionStandard.create!(tenant: tenant, unit_version: v2, standard: std1)
      UnitVersionStandard.create!(tenant: tenant, unit_version: v2, standard: std2)

      Current.tenant = nil

      get "/api/v1/academic_years/#{ay.id}/standards_coverage",
          params: { standard_framework_id: framework.id }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.length).to eq(2)

      std1_data = body.find { |s| s["code"] == "CCSS.1" }
      expect(std1_data["covered"]).to be true
      expect(std1_data["unit_plan_ids"]).to contain_exactly(up1.id, up2.id)

      std2_data = body.find { |s| s["code"] == "CCSS.2" }
      expect(std2_data["covered"]).to be true
      expect(std2_data["unit_plan_ids"]).to eq([ up2.id ])
    end
  end
end
