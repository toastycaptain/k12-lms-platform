require "rails_helper"

RSpec.describe "Api::V1::Enrollments", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/enrollments" do
    it "creates an enrollment" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      student = create(:user, tenant: tenant)
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      section = create(:section, tenant: tenant, course: course, term: term)
      Current.tenant = nil

      expect {
        post "/api/v1/enrollments", params: {
          enrollment: { user_id: student.id, section_id: section.id, role: "student" }
        }
      }.to change(Enrollment.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "rejects duplicate enrollment" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      student = create(:user, tenant: tenant)
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
      Current.tenant = nil

      post "/api/v1/enrollments", params: {
        enrollment: { user_id: student.id, section_id: section.id, role: "teacher" }
      }

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/enrollments" do
    it "returns only the current student's enrollments" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      own_section = create(:section, tenant: tenant, course: course, term: term)
      other_section = create(:section, tenant: tenant, course: course, term: term)
      own_enrollment = create(:enrollment, tenant: tenant, user: student, section: own_section, role: "student")
      create(:enrollment, tenant: tenant, section: other_section, role: "student")
      Current.tenant = nil

      get "/api/v1/enrollments"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["id"]).to eq(own_enrollment.id)
    end

    it "returns enrollments for sections taught by a teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      taught_section = create(:section, tenant: tenant, course: course, term: term)
      untaught_section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: teacher, section: taught_section, role: "teacher")
      taught_student = create(:enrollment, tenant: tenant, section: taught_section, role: "student")
      create(:enrollment, tenant: tenant, section: untaught_section, role: "student")
      Current.tenant = nil

      get "/api/v1/enrollments"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to include(taught_student.id)
      expect(response.parsed_body.all? { |row| row["section_id"] == taught_section.id }).to be(true)
    end
  end

  describe "GET /api/v1/enrollments/:id" do
    it "returns forbidden when viewing another student's enrollment" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      other_student = create(:user, tenant: tenant)
      other_student.add_role(:student)
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      section = create(:section, tenant: tenant, course: course, term: term)
      enrollment = create(:enrollment, tenant: tenant, user: other_student, section: section, role: "student")
      Current.tenant = nil

      get "/api/v1/enrollments/#{enrollment.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/enrollments/:id" do
    it "deletes an enrollment" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      student = create(:user, tenant: tenant)
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      section = create(:section, tenant: tenant, course: course, term: term)
      enrollment = create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
      Current.tenant = nil

      expect {
        delete "/api/v1/enrollments/#{enrollment.id}"
      }.to change(Enrollment.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
