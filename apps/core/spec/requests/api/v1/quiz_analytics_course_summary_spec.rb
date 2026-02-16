require "rails_helper"

RSpec.describe "Api::V1::QuizAnalyticsCourseSummary", type: :request do
  let!(:tenant) { create(:tenant) }

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Casey", last_name: "Teacher")
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:student_one) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Avery", last_name: "Learner")
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:student_two) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Blake", last_name: "Learner")
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student_one, section: section, role: "student")
    create(:enrollment, tenant: tenant, user: student_two, section: section, role: "student")
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/courses/:id/quiz_performance" do
    it "returns per-student summaries and class-level quiz performance" do
      Current.tenant = tenant
      quiz_one = create(:quiz, tenant: tenant, course: course, created_by: teacher, title: "Quiz One", status: "published")
      quiz_two = create(:quiz, tenant: tenant, course: course, created_by: teacher, title: "Quiz Two", status: "published")
      create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "draft")

      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz_one,
        user: student_one,
        attempt_number: 1,
        status: "graded",
        percentage: 80,
        score: 8
      )
      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz_two,
        user: student_one,
        attempt_number: 1,
        status: "graded",
        percentage: 70,
        score: 7
      )
      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz_one,
        user: student_two,
        attempt_number: 1,
        status: "graded",
        percentage: 60,
        score: 6
      )
      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz_two,
        user: student_two,
        attempt_number: 1,
        status: "submitted"
      )
      quiz_two.update!(status: "closed")
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)

      get "/api/v1/courses/#{course.id}/quiz_performance"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body).to include(
        "course_id" => course.id,
        "total_quizzes" => 2,
        "total_graded_attempts" => 3,
        "class_average" => 70.0
      )

      expect(body.fetch("students").map { |student| student["user_id"] }).to eq([ student_one.id, student_two.id ])

      first_student = body.fetch("students").first
      expect(first_student).to include(
        "user_id" => student_one.id,
        "quizzes_taken" => 2,
        "average_score" => 75.0,
        "highest_score" => 80.0,
        "lowest_score" => 70.0
      )
      expect(first_student.fetch("quiz_scores").length).to eq(2)

      quiz_comparison = body.fetch("quiz_comparison")
      quiz_one_row = quiz_comparison.find { |row| row["quiz_id"] == quiz_one.id }
      quiz_two_row = quiz_comparison.find { |row| row["quiz_id"] == quiz_two.id }
      expect(quiz_one_row).to include("attempt_count" => 2, "class_average" => 70.0)
      expect(quiz_two_row).to include("attempt_count" => 1, "class_average" => 70.0)
    end

    it "calculates per-student averages from graded attempts" do
      Current.tenant = tenant
      quiz = create(
        :quiz,
        tenant: tenant,
        course: course,
        created_by: teacher,
        status: "published",
        attempts_allowed: 2
      )

      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_one,
        attempt_number: 1,
        status: "graded",
        percentage: 60,
        score: 6
      )
      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_one,
        attempt_number: 2,
        status: "graded",
        percentage: 90,
        score: 9
      )
      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_two,
        attempt_number: 1,
        status: "graded",
        percentage: 75,
        score: 7.5
      )
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)

      get "/api/v1/courses/#{course.id}/quiz_performance"

      expect(response).to have_http_status(:ok)
      students = response.parsed_body.fetch("students")

      student_one_row = students.find { |row| row["user_id"] == student_one.id }
      student_two_row = students.find { |row| row["user_id"] == student_two.id }

      expect(student_one_row).to include(
        "average_score" => 75.0,
        "highest_score" => 90.0,
        "lowest_score" => 60.0
      )
      expect(student_two_row).to include(
        "average_score" => 75.0,
        "highest_score" => 75.0,
        "lowest_score" => 75.0
      )
    end

    it "returns an empty summary for courses without published or closed quizzes" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/courses/#{course.id}/quiz_performance"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body).to include(
        "course_id" => course.id,
        "total_quizzes" => 0,
        "total_graded_attempts" => 0,
        "class_average" => nil
      )
      expect(body["students"]).to eq([])
      expect(body["quiz_comparison"]).to eq([])
    end
  end
end
