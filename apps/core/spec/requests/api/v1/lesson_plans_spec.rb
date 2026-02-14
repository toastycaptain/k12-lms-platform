require "rails_helper"

RSpec.describe "Api::V1::LessonPlans", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  let(:setup_data) do
    Current.tenant = tenant
    ay = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: ay)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
    Current.tenant = nil
    { unit_plan: unit_plan, course: course }
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/unit_plans/:unit_plan_id/lesson_plans" do
    it "returns lesson plans ordered by position" do
      mock_session(teacher, tenant: tenant)
      data = setup_data
      Current.tenant = tenant
      create(:lesson_plan, tenant: tenant, unit_plan: data[:unit_plan], created_by: teacher, position: 1, title: "Lesson B")
      create(:lesson_plan, tenant: tenant, unit_plan: data[:unit_plan], created_by: teacher, position: 0, title: "Lesson A")
      Current.tenant = nil

      get "/api/v1/unit_plans/#{data[:unit_plan].id}/lesson_plans"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.length).to eq(2)
      expect(body.first["title"]).to eq("Lesson A")
    end
  end

  describe "POST /api/v1/unit_plans/:unit_plan_id/lesson_plans" do
    it "creates a lesson plan with initial version" do
      mock_session(teacher, tenant: tenant)
      data = setup_data

      expect {
        post "/api/v1/unit_plans/#{data[:unit_plan].id}/lesson_plans", params: {
          lesson_plan: { title: "My Lesson", position: 0 }
        }
      }.to change(LessonPlan.unscoped, :count).by(1)
        .and change(LessonVersion.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["current_version_id"]).to be_present
      expect(body["created_by_id"]).to eq(teacher.id)
    end
  end

  describe "PATCH /api/v1/unit_plans/:unit_plan_id/lesson_plans/:id" do
    it "updates a lesson plan" do
      mock_session(teacher, tenant: tenant)
      data = setup_data
      Current.tenant = tenant
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: data[:unit_plan], created_by: teacher)
      Current.tenant = nil

      patch "/api/v1/unit_plans/#{data[:unit_plan].id}/lesson_plans/#{lesson_plan.id}",
        params: { lesson_plan: { title: "Updated Title" } }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Title")
    end
  end

  describe "DELETE /api/v1/unit_plans/:unit_plan_id/lesson_plans/:id" do
    it "deletes a lesson plan" do
      mock_session(teacher, tenant: tenant)
      data = setup_data
      Current.tenant = tenant
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: data[:unit_plan], created_by: teacher)
      Current.tenant = nil

      expect {
        delete "/api/v1/unit_plans/#{data[:unit_plan].id}/lesson_plans/#{lesson_plan.id}"
      }.to change(LessonPlan.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/unit_plans/:unit_plan_id/lesson_plans/:id/create_version" do
    it "creates a new version" do
      mock_session(teacher, tenant: tenant)
      data = setup_data
      Current.tenant = tenant
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: data[:unit_plan], created_by: teacher)
      lesson_plan.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{data[:unit_plan].id}/lesson_plans/#{lesson_plan.id}/create_version", params: {
        version: {
          title: "Revised Lesson",
          objectives: "New objectives",
          activities: "New activities",
          materials: "New materials",
          duration_minutes: 60
        }
      }

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["version_number"]).to eq(2)
      expect(body["objectives"]).to eq("New objectives")
      expect(body["duration_minutes"]).to eq(60)
    end
  end

  describe "GET /api/v1/unit_plans/:unit_plan_id/lesson_plans/:id/versions" do
    it "returns all versions ordered by version_number desc" do
      mock_session(teacher, tenant: tenant)
      data = setup_data
      Current.tenant = tenant
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: data[:unit_plan], created_by: teacher)
      lesson_plan.create_version!(title: "v1")
      lesson_plan.create_version!(title: "v2")
      Current.tenant = nil

      get "/api/v1/unit_plans/#{data[:unit_plan].id}/lesson_plans/#{lesson_plan.id}/versions"

      expect(response).to have_http_status(:ok)
      versions = response.parsed_body
      expect(versions.length).to eq(2)
      expect(versions.first["version_number"]).to eq(2)
    end
  end
end
