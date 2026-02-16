require "rails_helper"

RSpec.describe "Api::V1::AttemptAnswerGrading", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:quiz) do
    create(
      :quiz,
      tenant: tenant,
      course: course,
      created_by: teacher,
      status: "published",
      attempts_allowed: 3,
      points_possible: 5
    )
  end
  let(:question) { create(:question, tenant: tenant) }
  let(:quiz_item) { create(:quiz_item, tenant: tenant, quiz: quiz, question: question, points: 5) }
  let(:attempt) { create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "submitted", attempt_number: 1) }
  let(:answer) { create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question, points_awarded: nil) }

  after { Current.tenant = nil }

  describe "POST /api/v1/attempt_answers/:id/grade" do
    it "grades an answer for teacher who manages the quiz" do
      mock_session(teacher, tenant: tenant)
      quiz_item
      answer

      post "/api/v1/attempt_answers/#{answer.id}/grade", params: { points_awarded: 4, feedback: "Good work", is_correct: true }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["points_awarded"].to_f).to eq(4.0)
      expect(response.parsed_body["feedback"]).to eq("Good work")
      expect(answer.reload.graded_by_id).to eq(teacher.id)
    end

    it "returns 422 when points_awarded is out of range" do
      mock_session(teacher, tenant: tenant)
      quiz_item
      answer

      post "/api/v1/attempt_answers/#{answer.id}/grade", params: { points_awarded: 9 }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["error"]).to include("points_awarded must be between 0 and")
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)
      quiz_item
      answer

      post "/api/v1/attempt_answers/#{answer.id}/grade", params: { points_awarded: 3 }

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 404 for missing attempt answer" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/attempt_answers/999999/grade", params: { points_awarded: 2 }

      expect(response).to have_http_status(:not_found)
    end

    it "returns 401 when unauthenticated" do
      post "/api/v1/attempt_answers/#{answer.id}/grade", params: { points_awarded: 2 }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
