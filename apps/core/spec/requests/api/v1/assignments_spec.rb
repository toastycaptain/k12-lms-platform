require "rails_helper"

RSpec.describe "Api::V1::Assignments", type: :request do
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
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  after { Current.tenant = nil }

  describe "GET /api/v1/courses/:course_id/assignments" do
    it "lists assignments for a course" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:assignment, tenant: tenant, course: course, created_by: teacher, title: "Essay 1")
      create(:assignment, tenant: tenant, course: course, created_by: teacher, title: "Essay 2")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/assignments"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "filters by status" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "draft")
      create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/assignments", params: { status: "published" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["status"]).to eq("published")
    end
  end

  describe "POST /api/v1/courses/:course_id/assignments" do
    it "creates an assignment" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/courses/#{course.id}/assignments", params: {
        title: "New Essay",
        description: "Write an essay",
        assignment_type: "written",
        points_possible: 100
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("New Essay")
      expect(response.parsed_body["created_by_id"]).to eq(teacher.id)
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      post "/api/v1/courses/#{course.id}/assignments", params: {
        title: "New Essay",
        assignment_type: "written"
      }
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 422 for invalid assignment_type" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/courses/#{course.id}/assignments", params: {
        title: "Bad Type",
        assignment_type: "invalid"
      }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/assignments/:id" do
    let(:assignment) do
      Current.tenant = tenant
      a = create(:assignment, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil
      a
    end

    it "shows an assignment" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/assignments/#{assignment.id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq(assignment.title)
    end
  end

  describe "PATCH /api/v1/assignments/:id" do
    let(:assignment) do
      Current.tenant = tenant
      a = create(:assignment, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil
      a
    end

    it "updates an assignment" do
      mock_session(teacher, tenant: tenant)

      patch "/api/v1/assignments/#{assignment.id}", params: { title: "Updated Title" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Title")
    end
  end

  describe "DELETE /api/v1/assignments/:id" do
    let(:assignment) do
      Current.tenant = tenant
      a = create(:assignment, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil
      a
    end

    it "deletes for teacher" do
      mock_session(teacher, tenant: tenant)

      delete "/api/v1/assignments/#{assignment.id}"
      expect(response).to have_http_status(:no_content)
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      delete "/api/v1/assignments/#{assignment.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/assignments/:id/publish" do
    let(:assignment) do
      Current.tenant = tenant
      a = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "draft")
      Current.tenant = nil
      a
    end

    it "publishes a draft assignment" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/assignments/#{assignment.id}/publish"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
    end

    it "returns 422 if not draft" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      assignment.update!(status: "published")
      Current.tenant = nil

      post "/api/v1/assignments/#{assignment.id}/publish"
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "POST /api/v1/assignments/:id/close" do
    let(:assignment) do
      Current.tenant = tenant
      a = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil
      a
    end

    it "closes a published assignment" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/assignments/#{assignment.id}/close"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("closed")
    end
  end
end
