require "rails_helper"

RSpec.describe "Api::V1::StudentProgress", type: :request do
  let(:tenant) { create(:tenant, settings: { "mastery_threshold" => 80 }) }

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

  let(:other_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    Current.tenant = nil
    user
  end

  let(:unlinked_guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    Current.tenant = nil
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Sam", last_name: "Student")
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

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course_one) { create(:course, tenant: tenant, academic_year: academic_year, name: "Biology") }
  let(:course_two) { create(:course, tenant: tenant, academic_year: academic_year, name: "Algebra") }
  let(:section_one) { create(:section, tenant: tenant, course: course_one, term: term) }
  let(:section_two) { create(:section, tenant: tenant, course: course_two, term: term) }

  let!(:assignment_one) do
    create(
      :assignment,
      tenant: tenant,
      course: course_one,
      created_by: teacher,
      title: "Lab Writeup",
      points_possible: 100,
      status: "published",
      due_at: 3.days.ago
    )
  end

  let!(:assignment_two) do
    create(
      :assignment,
      tenant: tenant,
      course: course_two,
      created_by: other_teacher,
      title: "Problem Set",
      points_possible: 50,
      status: "published",
      due_at: 2.days.ago
    )
  end

  let!(:quiz_one) do
    create(
      :quiz,
      tenant: tenant,
      course: course_one,
      created_by: teacher,
      title: "Biology Quiz",
      status: "published",
      points_possible: 20
    )
  end

  let!(:quiz_two) do
    create(
      :quiz,
      tenant: tenant,
      course: course_two,
      created_by: other_teacher,
      title: "Algebra Quiz",
      status: "published",
      points_possible: 20
    )
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section_one, role: "teacher")
    create(:enrollment, tenant: tenant, user: other_teacher, section: section_two, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section_one, role: "student")
    create(:enrollment, tenant: tenant, user: student, section: section_two, role: "student")
    create(:guardian_link, tenant: tenant, guardian: guardian, student: student, status: "active")

    create(
      :submission,
      tenant: tenant,
      assignment: assignment_one,
      user: student,
      grade: 92,
      status: "graded",
      submitted_at: 3.days.ago,
      graded_at: 2.days.ago
    )

    create(
      :submission,
      tenant: tenant,
      assignment: assignment_two,
      user: student,
      grade: 35,
      status: "graded",
      submitted_at: 2.days.ago,
      graded_at: 1.day.ago
    )

    create(
      :quiz_attempt,
      tenant: tenant,
      quiz: quiz_one,
      user: student,
      status: "graded",
      score: 18,
      percentage: 90,
      submitted_at: 1.day.ago
    )

    create(
      :quiz_attempt,
      tenant: tenant,
      quiz: quiz_two,
      user: student,
      status: "graded",
      score: 14,
      percentage: 70,
      submitted_at: 1.day.ago
    )

    framework = create(:standard_framework, tenant: tenant, name: "NGSS")
    standard_one = create(:standard, tenant: tenant, standard_framework: framework, code: "SCI-1")
    standard_two = create(:standard, tenant: tenant, standard_framework: framework, code: "MATH-1")
    create(:assignment_standard, tenant: tenant, assignment: assignment_one, standard: standard_one)
    create(:assignment_standard, tenant: tenant, assignment: assignment_two, standard: standard_two)

    course_module = create(:course_module, tenant: tenant, course: course_one, status: "published")
    module_item_a = create(:module_item, tenant: tenant, course_module: course_module, position: 1)
    create(:module_item, tenant: tenant, course_module: course_module, position: 2)
    create(:module_item_completion, tenant: tenant, module_item: module_item_a, user: student)
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/students/:student_id/progress" do
    it "returns cross-course progress and standards mastery for the student" do
      mock_session(student, tenant: tenant)

      get "/api/v1/students/#{student.id}/progress"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body["student"]["id"]).to eq(student.id)
      expect(body["courses"].length).to eq(2)
      expect(body["courses"].map { |row| row["name"] }).to contain_exactly("Biology", "Algebra")
      expect(body["standards_mastery"].length).to eq(2)
      expect(body["overall"]["courses_count"]).to eq(2)
      expect(body["overall"]["mastered_standards"]).to eq(1)
      expect(body["overall"]["total_standards"]).to eq(2)
      expect(body["overall"]["completion_rate"]).to eq(100.0)
    end

    it "allows admins" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/students/#{student.id}/progress"

      expect(response).to have_http_status(:ok)
    end

    it "allows linked guardians" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/students/#{student.id}/progress"

      expect(response).to have_http_status(:ok)
    end

    it "limits teachers to shared courses in the summary payload" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/students/#{student.id}/progress"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["courses"].map { |row| row["id"] }).to contain_exactly(course_one.id)
    end

    it "forbids unlinked guardians" do
      mock_session(unlinked_guardian, tenant: tenant)

      get "/api/v1/students/#{student.id}/progress"

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids unrelated teachers" do
      mock_session(other_teacher, tenant: tenant)

      get "/api/v1/students/#{other_student.id}/progress"

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids students viewing other students" do
      mock_session(student, tenant: tenant)

      get "/api/v1/students/#{other_student.id}/progress"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/students/:student_id/progress/course/:course_id" do
    it "returns detailed progress payload for an accessible course" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/students/#{student.id}/progress/course/#{course_one.id}"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body["course"]["id"]).to eq(course_one.id)
      expect(body["assignments"].length).to eq(1)
      expect(body["quizzes"].length).to eq(1)
      expect(body["module_completion"]["total_modules"]).to eq(1)
      expect(body["standards"].length).to eq(1)
      expect(body["grade_trend"].length).to be >= 1
    end

    it "returns not found when a teacher requests a non-shared course detail" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/students/#{student.id}/progress/course/#{course_two.id}"

      expect(response).to have_http_status(:not_found)
    end
  end
end
