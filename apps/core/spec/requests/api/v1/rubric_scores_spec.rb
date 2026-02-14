require "rails_helper"

RSpec.describe "Api::V1::RubricScores", type: :request do
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
  let(:rubric) do
    Current.tenant = tenant
    r = create(:rubric, tenant: tenant, created_by: teacher, points_possible: 100)
    Current.tenant = nil
    r
  end
  let(:criterion1) do
    Current.tenant = tenant
    c = create(:rubric_criterion, tenant: tenant, rubric: rubric, title: "Content", points: 50)
    Current.tenant = nil
    c
  end
  let(:criterion2) do
    Current.tenant = tenant
    c = create(:rubric_criterion, tenant: tenant, rubric: rubric, title: "Style", points: 50)
    Current.tenant = nil
    c
  end
  let(:assignment) do
    Current.tenant = tenant
    a = create(:assignment, tenant: tenant, course: course, created_by: teacher, rubric: rubric, status: "published", points_possible: 100)
    Current.tenant = nil
    a
  end
  let(:submission) do
    Current.tenant = tenant
    s = create(:submission, tenant: tenant, assignment: assignment, user: student, status: "submitted", submitted_at: Time.current)
    Current.tenant = nil
    s
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/submissions/:id/rubric_scores" do
    it "bulk creates rubric scores and auto-calculates grade" do
      mock_session(teacher, tenant: tenant)
      # Force lazy lets
      criterion1
      criterion2

      expect {
        post "/api/v1/submissions/#{submission.id}/rubric_scores", params: {
          scores: [
            { rubric_criterion_id: criterion1.id, points_awarded: 40, comments: "Good content" },
            { rubric_criterion_id: criterion2.id, points_awarded: 35, comments: "Decent style" }
          ]
        }
      }.to change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.length).to eq(2)
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("rubric_scores.applied")

      # Check auto-grade
      submission.reload
      expect(submission.grade).to eq(75)
      expect(submission.status).to eq("graded")
      expect(submission.graded_by_id).to eq(teacher.id)
    end

    it "updates existing scores on re-score" do
      mock_session(teacher, tenant: tenant)
      criterion1

      post "/api/v1/submissions/#{submission.id}/rubric_scores", params: {
        scores: [ { rubric_criterion_id: criterion1.id, points_awarded: 30 } ]
      }
      expect(response).to have_http_status(:created)

      post "/api/v1/submissions/#{submission.id}/rubric_scores", params: {
        scores: [ { rubric_criterion_id: criterion1.id, points_awarded: 45, comments: "Revised" } ]
      }
      expect(response).to have_http_status(:created)
      expect(submission.rubric_scores.count).to eq(1)
      expect(submission.reload.grade).to eq(45)
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      post "/api/v1/submissions/#{submission.id}/rubric_scores", params: {
        scores: [ { rubric_criterion_id: criterion1.id, points_awarded: 30 } ]
      }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/submissions/:id/rubric_scores" do
    it "returns rubric scores for a submission" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:rubric_score, tenant: tenant, submission: submission, rubric_criterion: criterion1, points_awarded: 40)
      Current.tenant = nil

      get "/api/v1/submissions/#{submission.id}/rubric_scores"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["points_awarded"]).to eq("40.0")
    end
  end
end
