require "rails_helper"

RSpec.describe "Api::V1::Submissions", type: :request do
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
  let(:other_student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end
  let(:other_teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:assignment) do
    Current.tenant = tenant
    a = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published")
    Current.tenant = nil
    a
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/assignments/:assignment_id/submissions" do
    it "creates a submission as student" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
      Current.tenant = nil

      post "/api/v1/assignments/#{assignment.id}/submissions", params: {
        submission_type: "text",
        body: "My essay content"
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["user_id"]).to eq(student.id)
      expect(response.parsed_body["status"]).to eq("submitted")
      expect(response.parsed_body["submitted_at"]).to be_present
    end

    it "returns 403 for teachers" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/assignments/#{assignment.id}/submissions", params: {
        submission_type: "text",
        body: "Teacher body"
      }
      expect(response).to have_http_status(:forbidden)
    end

    it "prevents duplicate submissions" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
      Current.tenant = nil

      post "/api/v1/assignments/#{assignment.id}/submissions", params: {
        submission_type: "text",
        body: "First submission"
      }
      expect(response).to have_http_status(:created)

      post "/api/v1/assignments/#{assignment.id}/submissions", params: {
        submission_type: "text",
        body: "Second submission"
      }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/assignments/:assignment_id/submissions" do
    it "teacher sees all submissions" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:submission, tenant: tenant, assignment: assignment, user: student, status: "submitted", submitted_at: Time.current)
      create(:submission, tenant: tenant, assignment: assignment, user: other_student, status: "submitted", submitted_at: Time.current)
      Current.tenant = nil

      get "/api/v1/assignments/#{assignment.id}/submissions"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "student sees only own submissions" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:submission, tenant: tenant, assignment: assignment, user: student, status: "submitted", submitted_at: Time.current)
      create(:submission, tenant: tenant, assignment: assignment, user: other_student, status: "submitted", submitted_at: Time.current)
      Current.tenant = nil

      get "/api/v1/assignments/#{assignment.id}/submissions"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["user_id"]).to eq(student.id)
    end
  end

  describe "GET /api/v1/submissions/:id" do
    it "shows a submission to its owner" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      submission = create(:submission, tenant: tenant, assignment: assignment, user: student, status: "submitted", submitted_at: Time.current)
      Current.tenant = nil

      get "/api/v1/submissions/#{submission.id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(submission.id)
    end

    it "returns 403 for other students" do
      mock_session(other_student, tenant: tenant)
      Current.tenant = tenant
      submission = create(:submission, tenant: tenant, assignment: assignment, user: student, status: "submitted", submitted_at: Time.current)
      Current.tenant = nil

      get "/api/v1/submissions/#{submission.id}"
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for unrelated teachers" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      other_assignment = create(:assignment, tenant: tenant, course: course, created_by: other_teacher, status: "published")
      submission = create(:submission, tenant: tenant, assignment: other_assignment, user: student, status: "submitted", submitted_at: Time.current)
      Current.tenant = nil

      get "/api/v1/submissions/#{submission.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/submissions" do
    it "returns scoped submissions and supports status filter" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      second_assignment = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published")
      graded = create(:submission, tenant: tenant, assignment: assignment, user: student, status: "graded", submitted_at: Time.current)
      create(:submission, tenant: tenant, assignment: second_assignment, user: student, status: "submitted", submitted_at: Time.current)
      create(:submission, tenant: tenant, assignment: assignment, user: other_student, status: "graded", submitted_at: Time.current)
      Current.tenant = nil

      get "/api/v1/submissions", params: { status: "graded" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["id"]).to eq(graded.id)
    end
  end
end
