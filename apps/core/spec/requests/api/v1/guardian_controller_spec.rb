require "rails_helper"

RSpec.describe "Api::V1::Guardian", type: :request do
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year, name: "Math 6") }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:guardian) do
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end

  let(:other_guardian) do
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end

  let(:teacher) do
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end

  let(:linked_student) do
    user = create(:user, tenant: tenant, first_name: "Lina", last_name: "Student")
    user.add_role(:student)
    user
  end

  let(:other_student) do
    user = create(:user, tenant: tenant, first_name: "Omar", last_name: "Student")
    user.add_role(:student)
    user
  end

  let!(:assignment) do
    create(
      :assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Fractions Homework",
      status: "published",
      due_at: 2.days.from_now,
      points_possible: 20
    )
  end

  let!(:draft_assignment) do
    create(
      :assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Draft Assignment",
      status: "draft",
      due_at: 5.days.from_now
    )
  end

  let!(:submission) do
    create(
      :submission,
      tenant: tenant,
      assignment: assignment,
      user: linked_student,
      status: "graded",
      grade: 18,
      graded_at: 1.day.ago,
      submitted_at: 2.days.ago
    )
  end

  let!(:quiz) do
    create(
      :quiz,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Fractions Quiz",
      status: "published",
      due_at: 3.days.from_now
    )
  end

  let!(:unit_plan) do
    create(
      :unit_plan,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Fractions Unit",
      status: "published",
      start_date: Date.current - 1.day,
      end_date: Date.current + 7.days
    )
  end

  let!(:announcement) do
    create(
      :announcement,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Quiz Reminder",
      message: "Bring a pencil"
    )
  end

  let!(:draft_announcement) do
    create(
      :announcement,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Draft Announcement",
      message: "Not yet published",
      published_at: nil
    )
  end

  before do
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    create(:enrollment, tenant: tenant, section: section, user: linked_student, role: "student")
    create(:enrollment, tenant: tenant, section: section, user: other_student, role: "student")
    create(
      :section_meeting,
      tenant: tenant,
      section: section,
      weekday: Time.current.wday,
      start_time: "09:00",
      end_time: "10:00",
      location: "Room 204"
    )
    create(
      :attendance,
      tenant: tenant,
      student: linked_student,
      section: section,
      recorded_by: teacher,
      status: "present",
      occurred_on: Date.current
    )
    create(
      :attendance,
      tenant: tenant,
      student: linked_student,
      section: section,
      recorded_by: teacher,
      status: "absent",
      occurred_on: Date.current - 1.day
    )
    create(
      :attendance,
      tenant: tenant,
      student: other_student,
      section: section,
      recorded_by: teacher,
      status: "present",
      occurred_on: Date.current
    )
    create(:guardian_link, tenant: tenant, guardian: guardian, student: linked_student, status: "active")
  end

  after do
    Current.user = nil
    Current.tenant = nil
  end

  describe "GET /api/v1/guardian/students" do
    it "returns only linked students for guardian users" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students"

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body.map { |row| row["id"] }
      expect(ids).to contain_exactly(linked_student.id)
    end

    it "returns forbidden for non-guardian users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/guardian/students"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/guardian/students/:id/grades" do
    it "returns grades for a linked student" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/grades"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first["assignment_title"]).to eq("Fractions Homework")
      expect(response.parsed_body.first["score"]).to eq(18.0)
    end

    it "returns forbidden for unlinked guardians" do
      mock_session(other_guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/grades"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/guardian/students/:id/assignments" do
    it "returns assignment list with guardian-safe status" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/assignments"

      expect(response).to have_http_status(:ok)
      titles = response.parsed_body.map { |row| row["title"] }
      expect(titles).to include("Fractions Homework")
      expect(titles).not_to include("Draft Assignment")
      expect(response.parsed_body.first["status"]).to eq("graded")
    end
  end

  describe "GET /api/v1/guardian/students/:id/announcements" do
    it "returns course announcements for linked students" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/announcements"

      expect(response).to have_http_status(:ok)
      titles = response.parsed_body.map { |row| row["title"] }
      expect(titles).to include("Quiz Reminder")
      expect(titles).not_to include("Draft Announcement")
    end
  end

  describe "GET /api/v1/guardian/students/:id/attendance" do
    it "returns attendance summary and records for linked students" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/attendance"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("summary", "total")).to eq(2)
      expect(response.parsed_body.dig("summary", "present")).to eq(1)
      expect(response.parsed_body.dig("summary", "absent")).to eq(1)
      expect(response.parsed_body["records"].first["course_name"]).to eq("Math 6")
      expect(response.parsed_body["records"].map { |row| row["student_id"] }).to all(eq(linked_student.id))
    end

    it "returns forbidden for unlinked guardians" do
      mock_session(other_guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/attendance"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/guardian/students/:id/classes_today" do
    it "returns today's class schedule for linked students" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/classes_today"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["course_name"]).to eq("Math 6")
      expect(response.parsed_body.first["location"]).to eq("Room 204")
      expect(response.parsed_body.first["student_id"]).to eq(linked_student.id)
      expect(response.parsed_body.first["teachers"].first["name"]).to eq("#{teacher.first_name} #{teacher.last_name}")
    end
  end

  describe "GET /api/v1/guardian/students/:id/calendar" do
    it "returns calendar events for linked student courses" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/calendar", params: {
        start_date: (Date.current - 2.days).iso8601,
        end_date: (Date.current + 10.days).iso8601
      }

      expect(response).to have_http_status(:ok)
      types = response.parsed_body.fetch("events").map { |row| row["type"] }
      expect(types).to include("unit_plan", "assignment", "quiz")
      titles = response.parsed_body.fetch("events").map { |row| row["title"] }
      expect(titles).to include("Fractions Unit", "Fractions Homework", "Fractions Quiz")
      expect(titles).not_to include("Draft Assignment")
    end
  end
end
