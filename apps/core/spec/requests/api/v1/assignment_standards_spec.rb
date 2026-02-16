require "rails_helper"

RSpec.describe "Api::V1::AssignmentStandards", type: :request do
  let!(:tenant) { create(:tenant) }
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
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:assignment) { create(:assignment, tenant: tenant, course: course, created_by: teacher) }
  let(:standard_framework) { create(:standard_framework, tenant: tenant) }
  let(:standard1) { create(:standard, tenant: tenant, standard_framework: standard_framework) }
  let(:standard2) { create(:standard, tenant: tenant, standard_framework: standard_framework, code: "MATH.2") }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    Current.tenant = nil
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/assignments/:assignment_id/standards" do
    it "lists standards linked to the assignment" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      assignment.assignment_standards.create!(tenant: tenant, standard: standard1)
      Current.tenant = nil

      get "/api/v1/assignments/#{assignment.id}/standards"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["id"] }).to include(standard1.id)
    end

    it "returns 404 for missing assignment" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/assignments/999999/standards"

      expect(response).to have_http_status(:not_found)
    end

    it "returns 401 when unauthenticated" do
      get "/api/v1/assignments/#{assignment.id}/standards"

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/assignments/:assignment_id/standards" do
    it "creates assignment standards for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/assignments/#{assignment.id}/standards", params: { standard_ids: [ standard1.id, standard2.id ] }

      expect(response).to have_http_status(:created)
      expect(assignment.assignment_standards.count).to eq(2)
      expect(response.parsed_body.map { |row| row["id"] }).to contain_exactly(standard1.id, standard2.id)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/assignments/#{assignment.id}/standards", params: { standard_ids: [ standard1.id ] }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/assignments/:assignment_id/standards/bulk_destroy" do
    it "removes selected assignment standards" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      kept = assignment.assignment_standards.create!(tenant: tenant, standard: standard1)
      removed = assignment.assignment_standards.create!(tenant: tenant, standard: standard2)
      Current.tenant = nil

      delete "/api/v1/assignments/#{assignment.id}/standards/bulk_destroy", params: { standard_ids: [ removed.standard_id ] }

      expect(response).to have_http_status(:no_content)
      expect(AssignmentStandard.exists?(removed.id)).to be(false)
      expect(AssignmentStandard.exists?(kept.id)).to be(true)
    end
  end
end
