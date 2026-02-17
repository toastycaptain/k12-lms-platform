require "rails_helper"

RSpec.describe "Api::V1::Gradebook", type: :request do
  let(:tenant) { create(:tenant, settings: { "mastery_threshold" => 80 }) }
  let(:other_tenant) { create(:tenant) }

  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
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
    user = create(:user, tenant: tenant, first_name: "Pat", last_name: "Learner")
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let!(:assignment_one) do
    create(:assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Unit Reflection",
      points_possible: 100,
      status: "published",
      due_at: 2.days.ago,
      assignment_type: "written")
  end

  let!(:assignment_two) do
    create(:assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Cell Quiz Review",
      points_possible: 100,
      status: "published",
      due_at: 2.days.ago,
      assignment_type: "discussion")
  end

  let!(:quiz) do
    create(:quiz,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Chapter Check",
      status: "published",
      points_possible: 20)
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student_one, section: section, role: "student")
    create(:enrollment, tenant: tenant, user: student_two, section: section, role: "student")

    create(:submission,
      tenant: tenant,
      assignment: assignment_one,
      user: student_one,
      grade: 90,
      status: "graded",
      submitted_at: 3.days.ago)

    create(:submission,
      tenant: tenant,
      assignment: assignment_one,
      user: student_two,
      grade: 70,
      status: "graded",
      submitted_at: 1.day.ago)

    create(:submission,
      tenant: tenant,
      assignment: assignment_two,
      user: student_two,
      grade: 80,
      status: "graded",
      submitted_at: 1.day.ago)

    create(:quiz_attempt,
      tenant: tenant,
      quiz: quiz,
      user: student_one,
      status: "graded",
      score: 18,
      percentage: 90,
      submitted_at: 1.day.ago)

    create(:quiz_attempt,
      tenant: tenant,
      quiz: quiz,
      user: student_two,
      status: "graded",
      score: 14,
      percentage: 70,
      submitted_at: 1.day.ago)

    framework = create(:standard_framework, tenant: tenant)
    standard = create(:standard, tenant: tenant, standard_framework: framework)
    AssignmentStandard.create!(tenant: tenant, assignment: assignment_one, standard: standard)

    # Control record in another tenant to ensure no leakage.
    other_user = create(:user, tenant: other_tenant)
    other_user.add_role(:student)
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/courses/:id/gradebook" do
    it "returns full gradebook response shape and calculations for enrolled teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/courses/#{course.id}/gradebook"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body.keys).to include("students", "assignments", "course_summary", "quizzes", "mastery_threshold")
      expect(body["students"].length).to eq(2)
      expect(body["assignments"].length).to eq(2)

      sam = body["students"].find { |row| row["id"] == student_one.id }
      pat = body["students"].find { |row| row["id"] == student_two.id }

      expect(sam["course_average"]).to eq(90.0)
      expect(sam["missing_count"]).to eq(1)
      expect(sam["late_count"]).to eq(0)
      expect(sam["mastery"]["percentage"]).to eq(100.0)

      expect(pat["course_average"]).to be_within(0.01).of(74.55)
      expect(pat["missing_count"]).to eq(0)
      expect(pat["late_count"]).to eq(2)

      assignment_summary = body["assignments"].find { |row| row["id"] == assignment_one.id }
      expect(assignment_summary["average"]).to eq(80.0)
      expect(assignment_summary["median"]).to eq(80.0)
      expect(assignment_summary["submission_count"]).to eq(2)
      expect(assignment_summary["graded_count"]).to eq(2)

      summary = body["course_summary"]
      expect(summary["student_count"]).to eq(2)
      expect(summary["assignment_count"]).to eq(2)
      expect(summary["overall_average"]).to be_within(0.01).of(82.28)
      expect(summary["grade_distribution"]).to eq({ "A" => 1, "B" => 0, "C" => 1, "D" => 0, "F" => 0 })
      expect(summary["students_with_missing_work"]).to eq(1)
      expect(summary["category_averages"]["written"]).to eq(80.0)
      expect(summary["category_averages"]["discussion"]).to eq(80.0)
      expect(summary["category_averages"]["quiz"]).to eq(80.0)
    end

    it "allows admins" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/courses/#{course.id}/gradebook"

      expect(response).to have_http_status(:ok)
    end

    it "forbids enrolled students" do
      mock_session(student_one, tenant: tenant)

      get "/api/v1/courses/#{course.id}/gradebook"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/courses/:id/gradebook/export" do
    it "returns a CSV export" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/courses/#{course.id}/gradebook/export"

      expect(response).to have_http_status(:ok)
      expect(response.headers["Content-Type"]).to include("text/csv")
      expect(response.body).to include("Student Name,Email,Unit Reflection,Cell Quiz Review,Course Average,Missing,Late,Mastery")
      expect(response.body).to include("Sam Student")
      expect(response.body).to include("MISSING")
      expect(response.body).to include("(LATE)")
      expect(response.body).to include("Class Average")
    end
  end
end
