require "rails_helper"

RSpec.describe "Api::V1::Questions" do
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
  let(:bank) do
    Current.tenant = tenant
    b = create(:question_bank, tenant: tenant, created_by: teacher)
    Current.tenant = nil
    b
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/question_banks/:id/questions" do
    it "lists questions in a bank" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:question, tenant: tenant, question_bank: bank, created_by: teacher)
      create(:question, :true_false, tenant: tenant, question_bank: bank, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/question_banks/#{bank.id}/questions"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "filters by question_type" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:question, tenant: tenant, question_bank: bank, created_by: teacher)
      create(:question, :essay, tenant: tenant, question_bank: bank, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/question_banks/#{bank.id}/questions", params: { question_type: "essay" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body[0]["question_type"]).to eq("essay")
    end
  end

  describe "POST /api/v1/question_banks/:id/questions" do
    it "creates a multiple_choice question as teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/question_banks/#{bank.id}/questions", params: {
        question_type: "multiple_choice",
        prompt: "What color is the sky?",
        choices: [ { text: "Red", key: "a" }, { text: "Blue", key: "b" } ],
        correct_answer: { key: "b" },
        points: 2.0
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["question_type"]).to eq("multiple_choice")
      expect(response.parsed_body["points"]).to eq("2.0")
    end

    it "creates a true_false question" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/question_banks/#{bank.id}/questions", params: {
        question_type: "true_false",
        prompt: "Water boils at 100C",
        correct_answer: { value: true }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["question_type"]).to eq("true_false")
    end

    it "creates a short_answer question" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/question_banks/#{bank.id}/questions", params: {
        question_type: "short_answer",
        prompt: "Capital of France?",
        correct_answer: { acceptable: [ "Paris" ] }
      }

      expect(response).to have_http_status(:created)
    end

    it "creates an essay question" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/question_banks/#{bank.id}/questions", params: {
        question_type: "essay",
        prompt: "Explain photosynthesis.",
        points: 10
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["question_type"]).to eq("essay")
    end

    it "rejects creation as student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/question_banks/#{bank.id}/questions", params: {
        question_type: "multiple_choice",
        prompt: "Test?"
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/questions/:id" do
    it "shows a question" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      question = create(:question, tenant: tenant, question_bank: bank, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/questions/#{question.id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(question.id)
      expect(response.parsed_body["prompt"]).to eq(question.prompt)
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      question = create(:question, tenant: tenant, question_bank: bank, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/questions/#{question.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/questions/:id" do
    it "updates a question" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      question = create(:question, tenant: tenant, question_bank: bank, created_by: teacher)
      Current.tenant = nil

      patch "/api/v1/questions/#{question.id}", params: { prompt: "Updated prompt?" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["prompt"]).to eq("Updated prompt?")
    end
  end

  describe "DELETE /api/v1/questions/:id" do
    it "deletes a question" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      question = create(:question, tenant: tenant, question_bank: bank, created_by: teacher)
      Current.tenant = nil

      delete "/api/v1/questions/#{question.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
