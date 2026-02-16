require "rails_helper"

RSpec.describe "Api::V1::Assignments sync_grades", type: :request do
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

  describe "POST /api/v1/assignments/:id/sync_grades" do
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
    let(:coursework_mapping) do
      Current.tenant = tenant
      m = create(:sync_mapping,
        tenant: tenant,
        integration_config: config,
        local_type: "Assignment",
        local_id: assignment.id,
        external_id: "cw_123",
        external_type: "classroom_coursework"
      )
      Current.tenant = nil
      m
    end

    before do
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      Current.tenant = nil
      config
      coursework_mapping
    end

    it "triggers grade sync for teacher" do
      mock_session(teacher, tenant: tenant)

      expect {
        post "/api/v1/assignments/#{assignment.id}/sync_grades"
      }.to have_enqueued_job(ClassroomGradePassbackJob)

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["message"]).to eq("Grade sync triggered")
    end

    it "returns 422 when no coursework mapping exists" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      unmapped_assignment = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published")
      Current.tenant = nil

      post "/api/v1/assignments/#{unmapped_assignment.id}/sync_grades"

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to eq("Assignment has no Classroom coursework mapping")
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/assignments/#{assignment.id}/sync_grades"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
