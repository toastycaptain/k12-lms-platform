require "rails_helper"

RSpec.describe "Api::V1::IntegrationConfigs Sync", type: :request do
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

  describe "POST /api/v1/integration_configs/:id/sync_courses" do
    let(:config) do
      Current.tenant = tenant
      c = create(:integration_config, tenant: tenant, created_by: admin, status: "active")
      Current.tenant = nil
      c
    end

    it "triggers sync for admin" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/integration_configs/#{config.id}/sync_courses"
      }.to have_enqueued_job(ClassroomCourseSyncJob).with(config.id, admin.id)
        .and change(AuditLog.unscoped, :count).by(1)

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["message"]).to eq("Sync triggered")
      expect(AuditLog.unscoped.order(:id).last.event_type).to eq("integration.sync_courses_triggered")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/integration_configs/#{config.id}/sync_courses"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      post "/api/v1/integration_configs/#{config.id}/sync_courses"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
