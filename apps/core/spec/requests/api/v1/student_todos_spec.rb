require "rails_helper"

RSpec.describe "Api::V1::StudentTodos", type: :request do
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  let(:other_student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")

    assignment_due = create(
      :assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      status: "published",
      title: "Essay draft",
      due_at: 2.days.from_now
    )

    assignment_done = create(
      :assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      status: "published",
      title: "Completed worksheet",
      due_at: 1.day.from_now
    )

    create(
      :submission,
      tenant: tenant,
      assignment: assignment_done,
      user: student,
      status: "submitted",
      submitted_at: Time.current
    )

    quiz = create(
      :quiz,
      tenant: tenant,
      course: course,
      created_by: teacher,
      status: "published",
      title: "Chapter quiz",
      due_at: 3.days.from_now
    )

    create(
      :quiz_attempt,
      tenant: tenant,
      quiz: quiz,
      user: student,
      status: "in_progress",
      started_at: 1.hour.ago,
      attempt_number: 1
    )

    create(:goal, tenant: tenant, student: student, title: "Practice math facts", status: "active")
    create(:goal, tenant: tenant, student: student, title: "Archived goal", status: "archived")
    create(:goal, tenant: tenant, student: other_student, title: "Other student goal", status: "active")

    # Keep assignment_due referenced so it is not optimized away by lints.
    assignment_due
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/students/:student_id/todos" do
    it "returns assignment, quiz, and active goal todos" do
      mock_session(student, tenant: tenant)

      get "/api/v1/students/#{student.id}/todos"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body.map { |row| row["source_type"] }).to include("assignment", "quiz", "goal")
      expect(body.map { |row| row["title"] }).to include("Essay draft", "Chapter quiz", "Practice math facts")
      expect(body.map { |row| row["title"] }).not_to include("Completed worksheet", "Archived goal")
    end

    it "forbids unrelated students" do
      mock_session(other_student, tenant: tenant)

      get "/api/v1/students/#{student.id}/todos"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
