require "rails_helper"
require_relative "workflow_helper"

RSpec.describe "PRD-18 course delivery workflow", type: :request do
  include WorkflowHelper

  before { setup_tenant_and_users }
  after { cleanup_current_context }

  it "completes view modules, submit, grade, feedback, and mastery flow" do
    course = nil
    section = nil
    standard = nil

    with_tenant do
      academic_year = create(:academic_year, tenant: @tenant)
      term = create(:term, tenant: @tenant, academic_year: academic_year)
      course = create(:course, tenant: @tenant, academic_year: academic_year)
      section = create(:section, tenant: @tenant, course: course, term: term)
      create(:enrollment, tenant: @tenant, section: section, user: @teacher, role: "teacher")
      create(:enrollment, tenant: @tenant, section: section, user: @student, role: "student")

      framework = create(:standard_framework, tenant: @tenant)
      standard = create(:standard, tenant: @tenant, standard_framework: framework, code: "CCSS.MATH.5.NF.2")
    end

    created_module = api_post(
      "courses/#{course.id}/modules",
      user: @teacher,
      status: :created,
      params: { title: "Module 1", description: "Fractions foundations", position: 1 }
    )
    expect(created_module["title"]).to eq("Module 1")

    visible_modules = api_get("courses/#{course.id}/modules", user: @student)
    expect(visible_modules.map { |row| row["id"] }).to include(created_module["id"])

    assignment = api_post(
      "courses/#{course.id}/assignments",
      user: @teacher,
      status: :created,
      params: {
        title: "Homework 1",
        description: "Solve 12 fraction problems.",
        assignment_type: "written",
        points_possible: 100,
        due_at: 1.week.from_now.iso8601
      }
    )
    expect(assignment["status"]).to eq("draft")

    aligned_standards = api_post(
      "assignments/#{assignment["id"]}/standards",
      user: @teacher,
      status: :created,
      params: { standard_ids: [ standard.id ] }
    )
    expect(aligned_standards.map { |row| row["id"] }).to include(standard.id)

    published_assignment = api_post("assignments/#{assignment["id"]}/publish", user: @teacher, status: :ok)
    expect(published_assignment["status"]).to eq("published")

    submission = api_post(
      "assignments/#{assignment["id"]}/submissions",
      user: @student,
      status: :created,
      params: { submission_type: "text", body: "My answer to the assignment." }
    )
    expect(submission["status"]).to eq("submitted")

    graded_submission = api_post(
      "submissions/#{submission["id"]}/grade",
      user: @teacher,
      status: :ok,
      params: { grade: 85, feedback: "Good progress. Show all steps next time." }
    )
    expect(graded_submission["status"]).to eq("graded")
    expect(graded_submission["feedback"]).to include("Good progress")

    student_view = api_get("submissions/#{submission["id"]}", user: @student)
    expect(student_view["grade"].to_f).to eq(85.0)
    expect(student_view["feedback"]).to include("Good progress")

    gradebook = api_get("courses/#{course.id}/gradebook", user: @teacher)
    student_row = gradebook.fetch("students").find { |row| row["id"] == @student.id }
    expect(student_row).to be_present
    expect(student_row.fetch("grades").first["grade"]).to eq(85.0)
    expect(student_row["mastery"]).to include(
      "total_standards" => 1,
      "mastered_standards" => 1
    )
  end
end
