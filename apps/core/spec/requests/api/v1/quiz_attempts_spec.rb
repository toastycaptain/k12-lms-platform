require "rails_helper"

RSpec.describe "Api::V1::QuizAttempts" do
  let(:tenant) { create(:tenant) }
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
  let(:course) do
    Current.tenant = tenant
    c = create(:course, tenant: tenant)
    Current.tenant = nil
    c
  end
  let(:quiz) do
    Current.tenant = tenant
    q = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
    Current.tenant = nil
    q
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/quizzes/:quiz_id/attempts" do
    it "starts an attempt as student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/quizzes/#{quiz.id}/attempts"
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["attempt_number"]).to eq(1)
      expect(response.parsed_body["status"]).to eq("in_progress")
      expect(response.parsed_body["user_id"]).to eq(student.id)
    end

    it "rejects when quiz not published" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      draft_quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "draft")
      Current.tenant = nil

      post "/api/v1/quizzes/#{draft_quiz.id}/attempts"
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rejects when quiz is locked" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      locked_quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published", lock_at: 1.hour.ago)
      Current.tenant = nil

      post "/api/v1/quizzes/#{locked_quiz.id}/attempts"
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rejects when max attempts reached" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/attempts"
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/quizzes/:quiz_id/attempts" do
    it "lists attempts for the quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      Current.tenant = nil

      get "/api/v1/quizzes/#{quiz.id}/attempts"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "GET /api/v1/quiz_attempts/:id" do
    it "shows own attempt" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      Current.tenant = nil

      get "/api/v1/quiz_attempts/#{attempt.id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(attempt.id)
    end
  end

  describe "POST /api/v1/quiz_attempts/:id/submit" do
    it "submits an in-progress attempt" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1, started_at: 10.minutes.ago)
      Current.tenant = nil

      post "/api/v1/quiz_attempts/#{attempt.id}/submit"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to be_in(%w[submitted graded])
      expect(response.parsed_body["submitted_at"]).to be_present
      expect(response.parsed_body["time_spent_seconds"]).to be > 0
    end
  end
end
