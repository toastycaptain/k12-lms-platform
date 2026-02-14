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
        external_type: "classroom_course")
      Current.tenant = nil
      m
    end

    it "triggers roster sync for teacher" do
      mock_session(teacher, tenant: tenant)

      expect {
        post "/api/v1/sync_mappings/#{mapping.id}/sync_roster"
      }.to have_enqueued_job(ClassroomRosterSyncJob).with(config.id, teacher.id, mapping.id)

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["message"]).to eq("Roster sync triggered")
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
