require "rails_helper"

RSpec.describe "Api::V1::Quizzes" do
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
  let(:other_teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:course) do
    Current.tenant = tenant
    c = create(:course, tenant: tenant)
    Current.tenant = nil
    c
  end
  let(:term) do
    Current.tenant = tenant
    t = create(:term, tenant: tenant, academic_year: course.academic_year)
    Current.tenant = nil
    t
  end
  let(:section) do
    Current.tenant = tenant
    s = create(:section, tenant: tenant, course: course, term: term)
    Current.tenant = nil
    s
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/courses/:course_id/quizzes" do
    it "lists quizzes for a course" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz, tenant: tenant, course: course, created_by: teacher)
      create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/quizzes"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "filters by status" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "draft")
      create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/quizzes", params: { status: "published" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "does not expose quizzes for courses the teacher does not own or teach" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:quiz, tenant: tenant, course: course, created_by: other_teacher, title: "Restricted Quiz")
      Current.tenant = nil

      get "/api/v1/courses/#{course.id}/quizzes"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_empty
    end
  end

  describe "POST /api/v1/courses/:course_id/quizzes" do
    it "creates a quiz as teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
      Current.tenant = nil

      post "/api/v1/courses/#{course.id}/quizzes", params: {
        title: "Chapter 1 Quiz",
        description: "Test your knowledge",
        quiz_type: "standard",
        time_limit_minutes: 30,
        attempts_allowed: 2
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Chapter 1 Quiz")
      expect(response.parsed_body["time_limit_minutes"]).to eq(30)
      expect(response.parsed_body["attempts_allowed"]).to eq(2)
      expect(response.parsed_body["status"]).to eq("draft")
    end

    it "rejects creation as student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/courses/#{course.id}/quizzes", params: { title: "Student Quiz" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/quizzes/:id" do
    it "shows a quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/quizzes/#{quiz.id}"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(quiz.id)
    end
  end

  describe "PATCH /api/v1/quizzes/:id" do
    it "updates a quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      patch "/api/v1/quizzes/#{quiz.id}", params: { title: "Updated Quiz" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Quiz")
    end
  end

  describe "DELETE /api/v1/quizzes/:id" do
    it "deletes a quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher)
      Current.tenant = nil

      delete "/api/v1/quizzes/#{quiz.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/quizzes/:id/publish" do
    it "publishes a draft quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "draft")
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/publish"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
    end

    it "rejects publishing a non-draft quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/publish"
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "POST /api/v1/quizzes/:id/close" do
    it "closes a published quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/close"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("closed")
    end

    it "rejects closing a draft quiz" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "draft")
      Current.tenant = nil

      post "/api/v1/quizzes/#{quiz.id}/close"
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
