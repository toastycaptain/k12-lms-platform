require "rails_helper"

RSpec.describe "Api::V1::QuizItems" do
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
    q = create(:quiz, tenant: tenant, course: course, created_by: teacher)
    Current.tenant = nil
    q
  end
  let(:bank) do
    Current.tenant = tenant
    b = create(:question_bank, tenant: tenant, created_by: teacher)
    Current.tenant = nil
    b
  end
  let(:question1) do
    Current.tenant = tenant
    q = create(:question, tenant: tenant, question_bank: bank, created_by: teacher)
    Current.tenant = nil
    q
  end
  let(:question2) do
    Current.tenant = tenant
    q = create(:question, :true_false, tenant: tenant, question_bank: bank, created_by: teacher)
    Current.tenant = nil
    q
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/quizzes/:quiz_id/quiz_items" do
    it "lists quiz items ordered by position" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question1, position: 1, points: 2.0)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question2, position: 0, points: 3.0)
      Current.tenant = nil

      get "/api/v1/quizzes/#{quiz.id}/quiz_items"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
      expect(response.parsed_body[0]["position"]).to eq(0)
      expect(response.parsed_body[1]["position"]).to eq(1)
    end
  end

  describe "POST /api/v1/quizzes/:quiz_id/quiz_items" do
    it "adds a question to a quiz" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/quizzes/#{quiz.id}/quiz_items", params: {
        question_id: question1.id,
        points: 5.0
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["question_id"]).to eq(question1.id)
      expect(response.parsed_body["points"]).to eq("5.0")

      # Check quiz points recalculated
      quiz.reload
      expect(quiz.points_possible).to eq(5.0)
    end

    it "rejects duplicate question in same quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question1)
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/quiz_items", params: { question_id: question1.id }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rejects creation as student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/quizzes/#{quiz.id}/quiz_items", params: { question_id: question1.id }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/quiz_items/:id" do
    it "updates points" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      item = create(:quiz_item, tenant: tenant, quiz: quiz, question: question1, points: 1.0)
      Current.tenant = nil

      patch "/api/v1/quiz_items/#{item.id}", params: { points: 10.0 }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["points"]).to eq("10.0")

      quiz.reload
      expect(quiz.points_possible).to eq(10.0)
    end
  end

  describe "DELETE /api/v1/quiz_items/:id" do
    it "removes a question from quiz and recalculates points" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      item = create(:quiz_item, tenant: tenant, quiz: quiz, question: question1, points: 5.0)
      Current.tenant = nil

      delete "/api/v1/quiz_items/#{item.id}"
      expect(response).to have_http_status(:no_content)

      quiz.reload
      expect(quiz.points_possible).to eq(0)
    end
  end

  describe "POST /api/v1/quizzes/:quiz_id/reorder_items" do
    it "reorders quiz items" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      item1 = create(:quiz_item, tenant: tenant, quiz: quiz, question: question1, position: 0)
      item2 = create(:quiz_item, tenant: tenant, quiz: quiz, question: question2, position: 1)
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/reorder_items", params: { item_ids: [ item2.id, item1.id ] }
      expect(response).to have_http_status(:ok)

      items = response.parsed_body
      expect(items[0]["id"]).to eq(item2.id)
      expect(items[0]["position"]).to eq(0)
      expect(items[1]["id"]).to eq(item1.id)
      expect(items[1]["position"]).to eq(1)
    end
  end
end
