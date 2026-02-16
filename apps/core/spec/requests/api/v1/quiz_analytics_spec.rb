require "rails_helper"

RSpec.describe "Api::V1::QuizAnalytics", type: :request do
  let!(:tenant) { create(:tenant) }

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Taylor", last_name: "Teacher")
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:non_participant_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Alex", last_name: "Outsider")
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:student_one) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Sam", last_name: "Student")
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:student_two) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Riley", last_name: "Student")
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

  describe "GET /api/v1/quizzes/:id/analytics" do
    it "returns score statistics, distribution, and item analysis" do
      Current.tenant = tenant
      quiz = create(
        :quiz,
        tenant: tenant,
        course: course,
        created_by: teacher,
        status: "published",
        attempts_allowed: 2
      )
      question_bank = create(:question_bank, tenant: tenant, created_by: teacher)
      question_one = create(
        :question,
        tenant: tenant,
        question_bank: question_bank,
        created_by: teacher,
        question_type: "multiple_choice",
        prompt: "What is 2 + 2?",
        choices: [
          { "key" => "a", "text" => "4" },
          { "key" => "b", "text" => "5" }
        ],
        correct_answer: { "key" => "a" }
      )
      question_two = create(
        :question,
        :true_false,
        tenant: tenant,
        question_bank: question_bank,
        created_by: teacher,
        prompt: "The Earth is round."
      )

      create(:quiz_item, tenant: tenant, quiz: quiz, question: question_one, position: 0, points: 2.0)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question_two, position: 1, points: 3.0)

      attempt_one = create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_one,
        attempt_number: 1,
        status: "graded",
        score: 5.0,
        percentage: 80.0,
        time_spent_seconds: 300
      )
      attempt_two = create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_two,
        attempt_number: 1,
        status: "graded",
        score: 2.5,
        percentage: 50.0,
        time_spent_seconds: 420
      )
      create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_one,
        attempt_number: 2,
        status: "submitted"
      )

      create(
        :attempt_answer,
        tenant: tenant,
        quiz_attempt: attempt_one,
        question: question_one,
        answer: { "key" => "a" },
        is_correct: true,
        points_awarded: 2.0
      )
      create(
        :attempt_answer,
        tenant: tenant,
        quiz_attempt: attempt_two,
        question: question_one,
        answer: { "key" => "b" },
        is_correct: false,
        points_awarded: 0.0
      )
      create(
        :attempt_answer,
        tenant: tenant,
        quiz_attempt: attempt_one,
        question: question_two,
        answer: { "value" => true },
        is_correct: true,
        points_awarded: 3.0
      )
      create(
        :attempt_answer,
        tenant: tenant,
        quiz_attempt: attempt_two,
        question: question_two,
        answer: { "value" => false },
        is_correct: false,
        points_awarded: 0.0
      )
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)

      get "/api/v1/quizzes/#{quiz.id}/analytics"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body).to include(
        "quiz_id" => quiz.id,
        "total_attempts" => 2,
        "unique_students" => 2
      )

      expect(body["score_stats"]).to include(
        "mean" => 65.0,
        "median" => 65.0,
        "min" => 50.0,
        "max" => 80.0,
        "std_dev" => 15.0
      )

      expect(body["score_distribution"]).to eq(
        "0-59" => 1,
        "60-69" => 0,
        "70-79" => 0,
        "80-89" => 1,
        "90-100" => 0
      )

      expect(body["time_stats"]).to eq("mean" => 360, "min" => 300, "max" => 420)

      first_item = body.fetch("item_analysis").find { |item| item["question_id"] == question_one.id }
      expect(first_item).to include(
        "question_number" => 1,
        "total_responses" => 2,
        "correct_count" => 1,
        "difficulty" => 0.5,
        "avg_points" => 1.0
      )
      expect(first_item["choice_distribution"]).to include("a" => 1, "b" => 1)
    end

    it "returns zeroed summary values when no graded attempts exist" do
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
      question_bank = create(:question_bank, tenant: tenant, created_by: teacher)
      question = create(
        :question,
        tenant: tenant,
        question_bank: question_bank,
        created_by: teacher,
        prompt: "A standalone prompt"
      )
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question, position: 0, points: 2.0)
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)

      get "/api/v1/quizzes/#{quiz.id}/analytics"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body["total_attempts"]).to eq(0)
      expect(body["unique_students"]).to eq(0)
      expect(body["score_stats"]).to eq(
        "mean" => 0,
        "median" => 0,
        "min" => 0,
        "max" => 0,
        "std_dev" => 0
      )
      expect(body["time_stats"]).to eq("mean" => 0, "min" => 0, "max" => 0)

      item = body.fetch("item_analysis").first
      expect(item["total_responses"]).to eq(0)
      expect(item["difficulty"]).to be_nil
      expect(item["avg_points"]).to be_nil
    end

    it "forbids teachers who do not own or teach the quiz course" do
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      mock_session(non_participant_teacher, tenant: tenant)

      get "/api/v1/quizzes/#{quiz.id}/analytics"

      expect(response).to have_http_status(:forbidden)
    end

    it "calculates item difficulty as correct over total responses" do
      Current.tenant = tenant
      quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
      question_bank = create(:question_bank, tenant: tenant, created_by: teacher)
      question = create(
        :question,
        tenant: tenant,
        question_bank: question_bank,
        created_by: teacher,
        question_type: "multiple_choice",
        prompt: "Pick A",
        choices: [
          { "key" => "a", "text" => "A" },
          { "key" => "b", "text" => "B" }
        ],
        correct_answer: { "key" => "a" }
      )
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question, position: 0, points: 1.0)

      third_student = create(:user, tenant: tenant, first_name: "Jordan", last_name: "Student")
      third_student.add_role(:student)
      create(:enrollment, tenant: tenant, user: third_student, section: section, role: "student")

      attempt_one = create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_one,
        attempt_number: 1,
        status: "graded",
        percentage: 100,
        score: 1,
        time_spent_seconds: 120
      )
      attempt_two = create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: student_two,
        attempt_number: 1,
        status: "graded",
        percentage: 0,
        score: 0,
        time_spent_seconds: 130
      )
      attempt_three = create(
        :quiz_attempt,
        tenant: tenant,
        quiz: quiz,
        user: third_student,
        attempt_number: 1,
        status: "graded",
        percentage: 100,
        score: 1,
        time_spent_seconds: 140
      )

      create(
        :attempt_answer,
        tenant: tenant,
        quiz_attempt: attempt_one,
        question: question,
        answer: { "key" => "a" },
        is_correct: true,
        points_awarded: 1
      )
      create(
        :attempt_answer,
        tenant: tenant,
        quiz_attempt: attempt_two,
        question: question,
        answer: { "key" => "b" },
        is_correct: false,
        points_awarded: 0
      )
      create(
        :attempt_answer,
        tenant: tenant,
        quiz_attempt: attempt_three,
        question: question,
        answer: { "key" => "a" },
        is_correct: true,
        points_awarded: 1
      )
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)

      get "/api/v1/quizzes/#{quiz.id}/analytics"

      expect(response).to have_http_status(:ok)
      item = response.parsed_body.fetch("item_analysis").first
      expect(item["total_responses"]).to eq(3)
      expect(item["correct_count"]).to eq(2)
      expect(item["difficulty"]).to eq(0.667)
    end
  end
end
