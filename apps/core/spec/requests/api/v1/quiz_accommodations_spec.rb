require "rails_helper"

RSpec.describe "Api::V1::QuizAccommodations" do
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
  let(:other_student) do
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
    q = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published", time_limit_minutes: 60)
    Current.tenant = nil
    q
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/quizzes/:quiz_id/accommodations" do
    it "creates an accommodation as teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/quizzes/#{quiz.id}/accommodations", params: {
        user_id: student.id,
        extra_time_minutes: 30,
        extra_attempts: 1,
        notes: "IEP accommodation"
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["extra_time_minutes"]).to eq(30)
      expect(response.parsed_body["extra_attempts"]).to eq(1)
    end

    it "rejects duplicate accommodation for same user and quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student)
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/accommodations", params: {
        user_id: student.id, extra_time_minutes: 15
      }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rejects creation as student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/quizzes/#{quiz.id}/accommodations", params: {
        user_id: student.id, extra_time_minutes: 30
      }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/quizzes/:quiz_id/accommodations" do
    it "lists accommodations as teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student)
      Current.tenant = nil

      get "/api/v1/quizzes/#{quiz.id}/accommodations"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "lists only the current student's accommodation as student" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      own = create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student)
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: other_student)
      Current.tenant = nil

      get "/api/v1/quizzes/#{quiz.id}/accommodations"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["id"]).to eq(own.id)
      expect(response.parsed_body.first["user_id"]).to eq(student.id)
    end
  end

  describe "PATCH /api/v1/quiz_accommodations/:id" do
    it "updates an accommodation" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      acc = create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student, extra_time_minutes: 15)
      Current.tenant = nil

      patch "/api/v1/quiz_accommodations/#{acc.id}", params: { extra_time_minutes: 45 }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["extra_time_minutes"]).to eq(45)
    end
  end

  describe "DELETE /api/v1/quiz_accommodations/:id" do
    it "deletes an accommodation" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      acc = create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student)
      Current.tenant = nil

      delete "/api/v1/quiz_accommodations/#{acc.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "accommodation effects" do
    before do
      Current.tenant = tenant
      academic_year = create(:academic_year, tenant: tenant)
      term = create(:term, tenant: tenant, academic_year: academic_year)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
      Current.tenant = nil
    end

    it "allows extra attempt when accommodation grants extra_attempts" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student, extra_attempts: 1)
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/attempts"
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["attempt_number"]).to eq(2)
    end

    it "includes effective_time_limit with extra time in attempt" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student, extra_time_minutes: 30)
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/attempts"
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["effective_time_limit"]).to eq(90)
    end
  end
end
