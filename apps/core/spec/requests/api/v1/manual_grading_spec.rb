require "rails_helper"

RSpec.describe "Api::V1::ManualGrading" do
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
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) do
    Current.tenant = tenant
    c = create(:course, tenant: tenant, academic_year: academic_year)
    Current.tenant = nil
    c
  end
  let(:term) do
    Current.tenant = tenant
    t = create(:term, tenant: tenant, academic_year: academic_year)
    Current.tenant = nil
    t
  end
  let(:section) do
    Current.tenant = tenant
    s = create(:section, tenant: tenant, course: course, term: term)
    Current.tenant = nil
    s
  end
  let(:bank) do
    Current.tenant = tenant
    b = create(:question_bank, tenant: tenant, created_by: teacher)
    Current.tenant = nil
    b
  end
  let(:mc_question) do
    Current.tenant = tenant
    q = create(:question, tenant: tenant, question_bank: bank, created_by: teacher,
               question_type: "multiple_choice",
               choices: [ { "key" => "a", "text" => "Wrong" }, { "key" => "b", "text" => "Right" } ],
               correct_answer: { "key" => "b" },
               points: 5.0)
    Current.tenant = nil
    q
  end
  let(:essay_question) do
    Current.tenant = tenant
    q = create(:question, tenant: tenant, question_bank: bank, created_by: teacher,
               question_type: "essay", choices: nil, correct_answer: nil, points: 10.0)
    Current.tenant = nil
    q
  end
  let(:quiz) do
    Current.tenant = tenant
    q = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
    create(:quiz_item, tenant: tenant, quiz: q, question: mc_question, points: 5.0, position: 0)
    create(:quiz_item, tenant: tenant, quiz: q, question: essay_question, points: 10.0, position: 1)
    Current.tenant = nil
    q
  end
  let(:attempt) do
    Current.tenant = tenant
    a = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1, started_at: 30.minutes.ago)
    create(:attempt_answer, tenant: tenant, quiz_attempt: a, question: mc_question, answer: { "key" => "b" })
    create(:attempt_answer, tenant: tenant, quiz_attempt: a, question: essay_question, answer: { "text" => "My essay" })
    a.submit!
    Current.tenant = nil
    a
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
    Current.tenant = nil
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/attempt_answers/:id/grade" do
    it "grades an essay answer as teacher" do
      mock_session(teacher, tenant: tenant)
      essay_answer = attempt.attempt_answers.find_by(question_id: essay_question.id)

      expect {
        post "/api/v1/attempt_answers/#{essay_answer.id}/grade", params: {
          points_awarded: 8.0,
          feedback: "Good work but could be more detailed"
        }
      }.to change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["points_awarded"]).to eq("8.0")
      expect(response.parsed_body["feedback"]).to eq("Good work but could be more detailed")
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("attempt_answer.graded")

      attempt.reload
      expect(attempt.score.to_f).to eq(13.0)
      expect(attempt.status).to eq("graded")
    end

    it "allows overriding auto-graded answers" do
      mock_session(teacher, tenant: tenant)
      mc_answer = attempt.attempt_answers.find_by(question_id: mc_question.id)

      post "/api/v1/attempt_answers/#{mc_answer.id}/grade", params: {
        points_awarded: 3.0,
        feedback: "Partial credit",
        is_correct: false
      }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["points_awarded"]).to eq("3.0")
    end

    it "rejects grading as student" do
      mock_session(student, tenant: tenant)
      essay_answer = attempt.attempt_answers.find_by(question_id: essay_question.id)

      post "/api/v1/attempt_answers/#{essay_answer.id}/grade", params: { points_awarded: 10.0 }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/quiz_attempts/:id/grade_all" do
    it "bulk grades all answers" do
      mock_session(teacher, tenant: tenant)
      essay_answer = attempt.attempt_answers.find_by(question_id: essay_question.id)

      post "/api/v1/quiz_attempts/#{attempt.id}/grade_all", params: {
        grades: [
          { attempt_answer_id: essay_answer.id, points_awarded: 9.0, feedback: "Excellent" }
        ]
      }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("graded")
      expect(response.parsed_body["score"].to_f).to eq(14.0)
    end
  end

  describe "GET /api/v1/quizzes/:id/results" do
    it "returns quiz results for teacher" do
      mock_session(teacher, tenant: tenant)
      attempt # force creation

      get "/api/v1/quizzes/#{quiz.id}/results"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["attempts"].length).to eq(1)
      expect(response.parsed_body["attempts"][0]["user_id"]).to eq(student.id)
    end

    it "rejects results for student" do
      mock_session(student, tenant: tenant)
      attempt

      get "/api/v1/quizzes/#{quiz.id}/results"
      expect(response).to have_http_status(:forbidden)
    end
  end
end
