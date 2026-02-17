require "rails_helper"
require_relative "workflow_helper"

RSpec.describe "PRD-19 assessment workflow", type: :request do
  include WorkflowHelper

  before { setup_tenant_and_users }
  after { cleanup_current_context }

  it "completes build quiz, assign, attempt, auto-grade, and analyze flow" do
    course = nil
    section = nil

    with_tenant do
      academic_year = create(:academic_year, tenant: @tenant)
      term = create(:term, tenant: @tenant, academic_year: academic_year)
      course = create(:course, tenant: @tenant, academic_year: academic_year)
      section = create(:section, tenant: @tenant, course: course, term: term)
      create(:enrollment, tenant: @tenant, section: section, user: @teacher, role: "teacher")
      create(:enrollment, tenant: @tenant, section: section, user: @student, role: "student")
    end

    question_bank = api_post(
      "question_banks",
      user: @teacher,
      status: :created,
      params: {
        title: "Grade 5 Math Bank",
        description: "Core arithmetic checks",
        subject: "Math",
        grade_level: "5"
      }
    )
    expect(question_bank["id"]).to be_present

    question = api_post(
      "question_banks/#{question_bank["id"]}/questions",
      user: @teacher,
      status: :created,
      params: {
        question_type: "multiple_choice",
        prompt: "What is 2 + 2?",
        choices: [
          { key: "a", text: "3" },
          { key: "b", text: "4" },
          { key: "c", text: "5" }
        ],
        correct_answer: { key: "b" },
        points: 10
      }
    )
    expect(question["question_type"]).to eq("multiple_choice")

    quiz = api_post(
      "courses/#{course.id}/quizzes",
      user: @teacher,
      status: :created,
      params: {
        title: "Math Quiz 1",
        description: "Single-item benchmark",
        quiz_type: "standard",
        time_limit_minutes: 30,
        attempts_allowed: 1
      }
    )
    expect(quiz["status"]).to eq("draft")

    quiz_item = api_post(
      "quizzes/#{quiz["id"]}/quiz_items",
      user: @teacher,
      status: :created,
      params: { question_id: question["id"], points: 10.0 }
    )
    expect(quiz_item["question_id"]).to eq(question["id"])

    published_quiz = api_post("quizzes/#{quiz["id"]}/publish", user: @teacher, status: :ok)
    expect(published_quiz["status"]).to eq("published")

    attempt = api_post("quizzes/#{quiz["id"]}/attempts", user: @student, status: :created)
    expect(attempt["status"]).to eq("in_progress")

    answers = api_post(
      "quiz_attempts/#{attempt["id"]}/answers",
      user: @student,
      status: :created,
      params: { answers: [ { question_id: question["id"], answer: { key: "b" } } ] }
    )
    expect(answers.length).to eq(1)

    submitted_attempt = api_post("quiz_attempts/#{attempt["id"]}/submit", user: @student, status: :ok)
    expect(submitted_attempt["status"]).to eq("graded")
    expect(submitted_attempt["score"].to_f).to eq(10.0)

    analytics = api_get("quizzes/#{quiz["id"]}/analytics", user: @teacher)
    expect(analytics).to include("total_attempts" => 1, "unique_students" => 1)
    expect(analytics.dig("score_stats", "max").to_f).to eq(100.0)

    item_analysis = analytics.fetch("item_analysis").find { |item| item["question_id"] == question["id"] }
    expect(item_analysis).to include("total_responses" => 1, "correct_count" => 1)
  end
end
