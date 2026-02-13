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
