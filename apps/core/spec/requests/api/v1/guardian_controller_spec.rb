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

  before do
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    create(:enrollment, tenant: tenant, section: section, user: linked_student, role: "student")
    create(:enrollment, tenant: tenant, section: section, user: other_student, role: "student")
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
      expect(response.parsed_body.first["title"]).to eq("Fractions Homework")
      expect(response.parsed_body.first["status"]).to eq("graded")
    end
  end

  describe "GET /api/v1/guardian/students/:id/announcements" do
    it "returns course announcements for linked students" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/guardian/students/#{linked_student.id}/announcements"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first["title"]).to eq("Quiz Reminder")
    end
  end
end
