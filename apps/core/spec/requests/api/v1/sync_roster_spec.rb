require "rails_helper"

RSpec.describe "Api::V1::SyncMappings sync_roster", type: :request do
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
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/sync_mappings/:id/sync_roster" do
    let(:config) do
      Current.tenant = tenant
      c = create(:integration_config, tenant: tenant, created_by: admin, status: "active")
      Current.tenant = nil
      c
    end
    let(:mapping) do
      Current.tenant = tenant
      m = create(:sync_mapping, tenant: tenant, integration_config: config, local_type: "Course",
        local_id: course.id, external_type: "classroom_course")
      Current.tenant = nil
      m
    end

    it "triggers roster sync for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
      Current.tenant = nil

      expect {
        post "/api/v1/sync_mappings/#{mapping.id}/sync_roster"
      }.to have_enqueued_job(ClassroomRosterSyncJob).with(config.id, teacher.id, mapping.id)
        .and change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["message"]).to eq("Roster sync triggered")
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("integration.sync_roster_triggered")
    end

    it "triggers roster sync for admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/sync_mappings/#{mapping.id}/sync_roster"

      expect(response).to have_http_status(:accepted)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/sync_mappings/#{mapping.id}/sync_roster"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
