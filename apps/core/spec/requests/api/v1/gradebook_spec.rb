require "rails_helper"

RSpec.describe "Api::V1::Gradebook", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end
  let(:unenrolled_student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:assignment) { create(:assignment, tenant: tenant, course: course, status: "published") }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    create(:submission, tenant: tenant, assignment: assignment, user: student, grade: 95, status: "graded")
    Current.tenant = nil
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/courses/:id/gradebook" do
    it "allows admin" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/courses/#{course.id}/gradebook"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first).to include(
        "user_id" => student.id,
        "assignment_id" => assignment.id,
        "grade" => "95.0",
        "status" => "graded"
      )
    end

    it "allows enrolled teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/courses/#{course.id}/gradebook"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first.keys).to contain_exactly("user_id", "assignment_id", "grade", "status")
    end

    it "forbids unenrolled student" do
      mock_session(unenrolled_student, tenant: tenant)

      get "/api/v1/courses/#{course.id}/gradebook"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
