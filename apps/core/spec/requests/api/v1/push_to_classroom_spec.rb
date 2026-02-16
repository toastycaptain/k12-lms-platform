require "rails_helper"

RSpec.describe "Api::V1::Assignments push_to_classroom", type: :request do
  let!(:tenant) { create(:tenant) }
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
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/assignments/:id/push_to_classroom" do
    let(:config) do
      Current.tenant = tenant
      c = create(:integration_config, tenant: tenant, created_by: teacher, status: "active")
      Current.tenant = nil
      c
    end
    let(:assignment) do
      Current.tenant = tenant
      a = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil
      a
    end

    before do
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      Current.tenant = nil
      config
    end

    it "triggers push for teacher with published assignment" do
      mock_session(teacher, tenant: tenant)

      expect {
        post "/api/v1/assignments/#{assignment.id}/push_to_classroom"
      }.to have_enqueued_job(ClassroomCourseworkPushJob)

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["message"]).to eq("Push to Classroom triggered")
    end

    it "returns 422 for draft assignment" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      draft_assignment = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "draft")
      Current.tenant = nil

      post "/api/v1/assignments/#{draft_assignment.id}/push_to_classroom"

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to eq("Assignment must be published")
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/assignments/#{assignment.id}/push_to_classroom"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
