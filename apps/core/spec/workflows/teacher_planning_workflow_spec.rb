require "rails_helper"
require_relative "workflow_helper"

RSpec.describe "PRD-17 teacher planning workflow", type: :request do
  include WorkflowHelper

  before { setup_tenant_and_users }
  after { cleanup_current_context }

  it "completes create unit, align standards, draft lessons, attach drive, publish, and schedule" do
    course = nil
    standard = nil

    with_tenant do
      academic_year = create(:academic_year, tenant: @tenant)
      course = create(:course, tenant: @tenant, academic_year: academic_year)
      framework = create(:standard_framework, tenant: @tenant)
      standard = create(:standard, tenant: @tenant, standard_framework: framework, code: "CCSS.MATH.5.NF.1")
    end

    unit_plan = api_post(
      "unit_plans",
      user: @teacher,
      status: :created,
      params: { unit_plan: { course_id: course.id, title: "Fractions Unit" } }
    )
    expect(unit_plan["status"]).to eq("draft")
    expect(unit_plan["current_version_id"]).to be_present

    unit_version = api_post(
      "unit_plans/#{unit_plan["id"]}/create_version",
      user: @teacher,
      status: :created,
      params: {
        version: {
          title: "Fractions Unit v2",
          description: "Expanded practice and checks for understanding",
          essential_questions: [ "How are fractions used in real life?" ],
          enduring_understandings: [ "Fractions represent equal parts of a whole." ]
        }
      }
    )
    expect(unit_version["version_number"]).to eq(2)

    aligned_standards = api_post(
      "unit_versions/#{unit_version["id"]}/standards",
      user: @teacher,
      status: :created,
      params: { standard_ids: [ standard.id ] }
    )
    expect(aligned_standards.map { |row| row["id"] }).to include(standard.id)

    lesson_plan = api_post(
      "unit_plans/#{unit_plan["id"]}/lesson_plans",
      user: @teacher,
      status: :created,
      params: { lesson_plan: { title: "Lesson 1: Intro to Fractions", position: 0 } }
    )
    expect(lesson_plan["id"]).to be_present

    lesson_version = api_post(
      "unit_plans/#{unit_plan["id"]}/lesson_plans/#{lesson_plan["id"]}/create_version",
      user: @teacher,
      status: :created,
      params: {
        version: {
          title: "Lesson 1 Draft",
          objectives: "Students model equivalent fractions with visual representations.",
          activities: "Number line warm-up, guided practice, and exit ticket.",
          materials: "Fraction strips and digital slides.",
          duration_minutes: 45
        }
      }
    )
    expect(lesson_version["version_number"]).to eq(2)

    drive_link = api_post(
      "lesson_versions/#{lesson_version["id"]}/resource_links",
      user: @teacher,
      status: :created,
      params: {
        resource_link: {
          url: "https://docs.google.com/document/d/fractions-lesson",
          title: "Fractions Lesson Doc",
          provider: "google_drive",
          drive_file_id: "fractions-lesson"
        }
      }
    )
    expect(drive_link["provider"]).to eq("google_drive")

    published_unit = api_post("unit_plans/#{unit_plan["id"]}/publish", user: @teacher, status: :ok)
    expect(published_unit["status"]).to eq("published")

    scheduled_unit = api_patch(
      "unit_plans/#{unit_plan["id"]}",
      user: @teacher,
      status: :ok,
      params: { unit_plan: { start_date: "2026-09-01", end_date: "2026-09-30" } }
    )
    expect(scheduled_unit["start_date"]).to eq("2026-09-01")
    expect(scheduled_unit["end_date"]).to eq("2026-09-30")

    refreshed_unit = api_get("unit_plans/#{unit_plan["id"]}", user: @teacher)
    expect(refreshed_unit["status"]).to eq("published")
    expect(refreshed_unit["start_date"]).to eq("2026-09-01")
  end
end
