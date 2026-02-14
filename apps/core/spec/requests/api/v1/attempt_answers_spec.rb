require "rails_helper"

RSpec.describe "Api::V1::AttemptAnswers" do
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
  let(:tf_question) do
    Current.tenant = tenant
    q = create(:question, :true_false, tenant: tenant, question_bank: bank, created_by: teacher, points: 3.0)
    Current.tenant = nil
    q
  end
  let(:essay_question) do
    Current.tenant = tenant
    q = create(:question, tenant: tenant, question_bank: bank, created_by: teacher,
               question_type: "essay",
               choices: nil,
               correct_answer: nil,
               points: 10.0)
    Current.tenant = nil
    q
  end
  let(:quiz) do
    Current.tenant = tenant
    q = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
    create(:quiz_item, tenant: tenant, quiz: q, question: mc_question, points: 5.0, position: 0)
    create(:quiz_item, tenant: tenant, quiz: q, question: tf_question, points: 3.0, position: 1)
    Current.tenant = nil
    q
  end
  let(:quiz_with_essay) do
    Current.tenant = tenant
    q = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
    create(:quiz_item, tenant: tenant, quiz: q, question: mc_question, points: 5.0, position: 0)
    create(:quiz_item, tenant: tenant, quiz: q, question: essay_question, points: 10.0, position: 1)
    Current.tenant = nil
    q
  end
  let(:attempt) do
    Current.tenant = tenant
    a = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1, started_at: 10.minutes.ago)
    Current.tenant = nil
    a
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/quiz_attempts/:quiz_attempt_id/answers" do
    it "saves answers during an in-progress attempt" do
      mock_session(student, tenant: tenant)

      post "/api/v1/quiz_attempts/#{attempt.id}/answers", params: {
        answers: [
          { question_id: mc_question.id, answer: { key: "b" } },
          { question_id: tf_question.id, answer: { value: true } }
        ]
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body.length).to eq(2)
    end

    it "rejects saving to a submitted attempt" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      attempt.submit!
      Current.tenant = nil

      post "/api/v1/quiz_attempts/#{attempt.id}/answers", params: {
        answers: [ { question_id: mc_question.id, answer: { key: "a" } } ]
      }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/quiz_attempts/:quiz_attempt_id/answers" do
    it "lists answers for an attempt" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: mc_question, answer: { "key" => "b" })
      Current.tenant = nil

      get "/api/v1/quiz_attempts/#{attempt.id}/answers"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "auto-grading on submit" do
    it "auto-grades multiple choice and true/false correctly" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: mc_question, answer: { "key" => "b" })
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: tf_question, answer: { "value" => true })
      Current.tenant = nil

      post "/api/v1/quiz_attempts/#{attempt.id}/submit"
      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body["status"]).to eq("graded")
      expect(body["score"].to_f).to eq(8.0)
      expect(body["percentage"].to_f).to eq(100.0)
    end

    it "marks incorrect answers with 0 points" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: mc_question, answer: { "key" => "a" })
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: tf_question, answer: { "value" => false })
      Current.tenant = nil

      post "/api/v1/quiz_attempts/#{attempt.id}/submit"
      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body["status"]).to eq("graded")
      expect(body["score"].to_f).to eq(0.0)
    end

    it "leaves essay questions ungraded and keeps status as submitted" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      essay_attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz_with_essay, user: student, attempt_number: 1, started_at: 10.minutes.ago)
      create(:attempt_answer, tenant: tenant, quiz_attempt: essay_attempt, question: mc_question, answer: { "key" => "b" })
      create(:attempt_answer, tenant: tenant, quiz_attempt: essay_attempt, question: essay_question, answer: { "text" => "My essay response" })
      Current.tenant = nil

      post "/api/v1/quiz_attempts/#{essay_attempt.id}/submit"
      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      expect(body["status"]).to eq("submitted")
      expect(body["score"].to_f).to eq(5.0)
    end
  end
end
