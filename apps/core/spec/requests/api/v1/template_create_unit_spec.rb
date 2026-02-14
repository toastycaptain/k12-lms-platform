require "rails_helper"

RSpec.describe "Api::V1::Templates#create_unit", type: :request do
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
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/templates/:id/create_unit" do
    let(:course) do
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      c = create(:course, tenant: tenant, academic_year: ay)
      Current.tenant = nil
      c
    end

    let(:published_template) do
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: curriculum_lead, status: "draft")
      version = template.create_version!(
        title: "UbD Unit Template",
        description: "A standards-based unit template",
        essential_questions: [ "What is the big idea?", "How does this connect?" ],
        enduring_understandings: [ "Students will understand that..." ],
        suggested_duration_weeks: 4
      )
      framework = create(:standard_framework, tenant: tenant)
      standard1 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.Math.1")
      standard2 = create(:standard, tenant: tenant, standard_framework: framework, code: "CCSS.Math.2")
      TemplateVersionStandard.create!(tenant: tenant, template_version: version, standard: standard1)
      TemplateVersionStandard.create!(tenant: tenant, template_version: version, standard: standard2)
      template.publish!
      Current.tenant = nil
      template
    end

    it "creates a unit plan from a published template for a teacher" do
      mock_session(teacher, tenant: tenant)
      tmpl = published_template

      expect {
        post "/api/v1/templates/#{tmpl.id}/create_unit", params: { course_id: course.id }
      }.to change(UnitPlan.unscoped, :count).by(1)
        .and change(UnitVersion.unscoped, :count).by(1)
        .and change(UnitVersionStandard.unscoped, :count).by(2)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["title"]).to eq("UbD Unit Template")
      expect(body["status"]).to eq("draft")
      expect(body["created_by_id"]).to eq(teacher.id)
      expect(body["current_version_id"]).to be_present
    end

    it "copies template version fields to unit version" do
      mock_session(teacher, tenant: tenant)
      tmpl = published_template

      post "/api/v1/templates/#{tmpl.id}/create_unit", params: { course_id: course.id }

      Current.tenant = tenant
      unit_plan = UnitPlan.last
      version = unit_plan.current_version
      expect(version.title).to eq("UbD Unit Template")
      expect(version.description).to eq("A standards-based unit template")
      expect(version.essential_questions).to eq([ "What is the big idea?", "How does this connect?" ])
      expect(version.enduring_understandings).to eq([ "Students will understand that..." ])
      Current.tenant = nil
    end

    it "copies standards from template to unit version" do
      mock_session(teacher, tenant: tenant)
      tmpl = published_template

      post "/api/v1/templates/#{tmpl.id}/create_unit", params: { course_id: course.id }

      Current.tenant = tenant
      unit_plan = UnitPlan.last
      version = unit_plan.current_version
      expect(version.standards.count).to eq(2)
      expect(version.standards.pluck(:code)).to contain_exactly("CCSS.Math.1", "CCSS.Math.2")
      Current.tenant = nil
    end

    it "rejects creating unit from draft template" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      draft_template = create(:template, tenant: tenant, created_by: curriculum_lead, status: "draft")
      draft_template.create_version!(title: "Draft")
      Current.tenant = nil

      post "/api/v1/templates/#{draft_template.id}/create_unit", params: { course_id: course.id }

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "denies create_unit for student" do
      mock_session(student, tenant: tenant)
      tmpl = published_template

      post "/api/v1/templates/#{tmpl.id}/create_unit", params: { course_id: course.id }

      expect(response).to have_http_status(:forbidden)
    end

    it "allows curriculum lead to create unit from template" do
      mock_session(curriculum_lead, tenant: tenant)
      tmpl = published_template

      post "/api/v1/templates/#{tmpl.id}/create_unit", params: { course_id: course.id }

      expect(response).to have_http_status(:created)
    end
  end
end
