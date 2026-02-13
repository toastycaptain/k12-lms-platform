require "rails_helper"

RSpec.describe "Api::V1::UnitPlans", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
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

  describe "POST /api/v1/unit_plans" do
    it "creates a unit plan with initial version" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      Current.tenant = nil

      expect {
        post "/api/v1/unit_plans", params: {
          unit_plan: { course_id: course.id, title: "My Unit" }
        }
      }.to change(UnitPlan.unscoped, :count).by(1)
        .and change(UnitVersion.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["current_version_id"]).to be_present
      expect(body["created_by_id"]).to eq(teacher.id)
    end
  end

  describe "POST /api/v1/unit_plans/:id/create_version" do
    it "creates a new version" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/create_version", params: {
        version: {
          title: "Revised Unit",
          description: "Updated description",
          essential_questions: [ "Why?" ],
          enduring_understandings: [ "Because..." ]
        }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["version_number"]).to eq(2)
      expect(response.parsed_body["essential_questions"]).to eq([ "Why?" ])
    end
  end

  describe "GET /api/v1/unit_plans/:id/versions" do
    it "returns all versions ordered by version_number desc" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      unit_plan.create_version!(title: "v1")
      unit_plan.create_version!(title: "v2")
      Current.tenant = nil

      get "/api/v1/unit_plans/#{unit_plan.id}/versions"

      expect(response).to have_http_status(:ok)
      versions = response.parsed_body
      expect(versions.length).to eq(2)
      expect(versions.first["version_number"]).to eq(2)
    end
  end

  describe "GET /api/v1/unit_plans" do
    it "returns unit plans" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/unit_plans"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "PATCH /api/v1/unit_plans/:id" do
    it "updates a unit plan" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      patch "/api/v1/unit_plans/#{unit_plan.id}", params: { unit_plan: { title: "Updated Title" } }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Title")
    end
  end

  describe "DELETE /api/v1/unit_plans/:id" do
    it "deletes a unit plan" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      expect {
        delete "/api/v1/unit_plans/#{unit_plan.id}"
      }.to change(UnitPlan.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/unit_plans/:id/publish" do
    it "publishes a draft unit plan with a current version" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "draft")
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/publish"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
    end

    it "returns error when unit plan is already published" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/publish"

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "denies publish for non-owner non-admin" do
      other_teacher = nil
      Current.tenant = tenant
      other_teacher = create(:user, tenant: tenant)
      other_teacher.add_role(:teacher)
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "draft")
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      mock_session(other_teacher, tenant: tenant)

      post "/api/v1/unit_plans/#{unit_plan.id}/publish"

      expect(response).to have_http_status(:forbidden)
    end

    it "allows admin to publish any unit plan" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "draft")
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/publish"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
    end
  end

  describe "POST /api/v1/unit_plans/:id/export_pdf" do
    it "enqueues a PDF export job" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      unit_plan.create_version!(title: "v1")
      Current.tenant = nil

      expect {
        post "/api/v1/unit_plans/#{unit_plan.id}/export_pdf"
      }.to have_enqueued_job(PdfExportJob).with(unit_plan.id)

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["status"]).to eq("queued")
    end
  end

  describe "GET /api/v1/unit_plans/:id/export_pdf_status" do
    it "returns processing when no PDF is attached" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/unit_plans/#{unit_plan.id}/export_pdf_status"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("processing")
    end

    it "returns completed with download URL when PDF is attached" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      unit_plan.create_version!(title: "v1")

      PdfExportJob.perform_now(unit_plan.id)
      Current.tenant = nil

      get "/api/v1/unit_plans/#{unit_plan.id}/export_pdf_status"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["status"]).to eq("completed")
      expect(body["download_url"]).to be_present
    end
  end

  describe "POST /api/v1/unit_plans/:id/archive" do
    it "archives a published unit plan" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/archive"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("archived")
    end

    it "returns error when unit plan is not published" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher, status: "draft")
      Current.tenant = nil

      post "/api/v1/unit_plans/#{unit_plan.id}/archive"

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
