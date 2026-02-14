require "rails_helper"

RSpec.describe "Api::V1::Addon", type: :request do
  let!(:tenant) { create(:tenant) }
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
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/addon/unit_plans" do
    it "returns unit plans for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:unit_plan, tenant: tenant, course: course, created_by: teacher, title: "Unit A")
      create(:unit_plan, tenant: tenant, course: course, created_by: teacher, title: "Unit B")
      Current.tenant = nil

      get "/api/v1/addon/unit_plans"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
      expect(response.parsed_body.first).to have_key("title")
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      get "/api/v1/addon/unit_plans"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/addon/unit_plans/:id/lessons" do
    it "returns lesson plans for a unit plan" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: teacher, title: "Lesson 1", position: 0)
      create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: teacher, title: "Lesson 2", position: 1)
      Current.tenant = nil

      get "/api/v1/addon/unit_plans/#{unit_plan.id}/lessons"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
      expect(response.parsed_body.first["title"]).to eq("Lesson 1")
    end
  end

  describe "POST /api/v1/addon/attach" do
    it "creates a resource link" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      assignment = create(:assignment, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      expect {
        post "/api/v1/addon/attach", params: {
          linkable_type: "Assignment",
          linkable_id: assignment.id,
          drive_file_url: "https://docs.google.com/document/d/abc123",
          drive_file_title: "My Document",
          drive_file_id: "abc123",
          drive_mime_type: "application/vnd.google-apps.document"
        }
      }.to change(ResourceLink.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/addon/attach", params: {
        linkable_type: "Assignment",
        linkable_id: 1,
        drive_file_url: "https://docs.google.com/document/d/abc",
        drive_file_title: "Doc",
        drive_file_id: "abc",
        drive_mime_type: "text/plain"
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/addon/me" do
    it "returns current user info" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/addon/me"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(teacher.id)
      expect(response.parsed_body["email"]).to eq(teacher.email)
      expect(response.parsed_body["tenant_name"]).to eq(tenant.name)
    end
  end
end
