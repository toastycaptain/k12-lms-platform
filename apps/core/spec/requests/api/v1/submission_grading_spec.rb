require "rails_helper"

RSpec.describe "Api::V1::SubmissionGrading", type: :request do
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
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:assignment) do
    Current.tenant = tenant
    a = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published", points_possible: 100)
    Current.tenant = nil
    a
  end
  let(:submission) do
    Current.tenant = tenant
    s = create(:submission, tenant: tenant, assignment: assignment, user: student, status: "submitted", submitted_at: Time.current)
    Current.tenant = nil
    s
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
    Current.tenant = nil
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/submissions/:id/grade" do
    it "grades a submission" do
      mock_session(teacher, tenant: tenant)

      expect {
        post "/api/v1/submissions/#{submission.id}/grade", params: { grade: 85, feedback: "Good work!" }
      }.to change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["grade"]).to eq("85.0")
      expect(response.parsed_body["feedback"]).to eq("Good work!")
      expect(response.parsed_body["status"]).to eq("graded")
      expect(response.parsed_body["graded_by_id"]).to eq(teacher.id)
      expect(response.parsed_body["graded_at"]).to be_present
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("submission.graded")
    end

    it "re-grades an already graded submission" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      submission.update!(status: "graded", grade: 70, graded_at: Time.current, graded_by: teacher)
      Current.tenant = nil

      post "/api/v1/submissions/#{submission.id}/grade", params: { grade: 90, feedback: "Revised" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["grade"]).to eq("90.0")
    end

    it "returns 422 if grade exceeds points possible" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/submissions/#{submission.id}/grade", params: { grade: 150 }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "returns 422 if grade is negative" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/submissions/#{submission.id}/grade", params: { grade: -5 }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      post "/api/v1/submissions/#{submission.id}/grade", params: { grade: 85 }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/submissions/:id/return" do
    it "returns a graded submission" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      submission.update!(status: "graded", grade: 85, graded_at: Time.current, graded_by: teacher)
      Current.tenant = nil

      post "/api/v1/submissions/#{submission.id}/return"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("returned")
    end

    it "returns 422 if not graded" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/submissions/#{submission.id}/return"
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/courses/:id/gradebook" do
    it "returns gradebook for course" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:submission, tenant: tenant, assignment: assignment, user: student, status: "graded", grade: 85)
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/gradebook"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["user_id"]).to eq(student.id)
      expect(response.parsed_body.first["grade"]).to eq("85.0")
    end
  end
end
