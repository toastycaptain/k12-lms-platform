require "rails_helper"

RSpec.describe "Api::V1::SyncLogs", type: :request do
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
  let(:integration_config) do
    Current.tenant = tenant
    config = create(:integration_config, tenant: tenant, created_by: admin)
    Current.tenant = nil
    config
  end
  let(:sync_run) do
    Current.tenant = tenant
    run = create(:sync_run, tenant: tenant, integration_config: integration_config,
      triggered_by: admin)
    Current.tenant = nil
    run
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/sync_runs/:sync_run_id/sync_logs" do
    it "returns sync logs for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:sync_log, tenant: tenant, sync_run: sync_run, level: "info", message: "Started sync")
      create(:sync_log, tenant: tenant, sync_run: sync_run, level: "error", message: "Failed to sync")
      Current.tenant = nil

      get "/api/v1/sync_runs/#{sync_run.id}/sync_logs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      teacher_run = create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: teacher)
      create(:sync_log, tenant: tenant, sync_run: teacher_run, message: "Teacher sync log")
      Current.tenant = nil

      get "/api/v1/sync_runs/#{teacher_run.id}/sync_logs"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      get "/api/v1/sync_runs/#{sync_run.id}/sync_logs"

      expect(response).to have_http_status(:forbidden)
    end

    it "filters by level" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:sync_log, tenant: tenant, sync_run: sync_run, level: "info", message: "Info log")
      create(:sync_log, tenant: tenant, sync_run: sync_run, level: "error", message: "Error log")
      create(:sync_log, tenant: tenant, sync_run: sync_run, level: "warn", message: "Warn log")
      Current.tenant = nil

      get "/api/v1/sync_runs/#{sync_run.id}/sync_logs", params: { level: "error" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body[0]["level"]).to eq("error")
    end

    it "orders by created_at asc" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      older = create(:sync_log, tenant: tenant, sync_run: sync_run, message: "First",
        created_at: 2.hours.ago)
      newer = create(:sync_log, tenant: tenant, sync_run: sync_run, message: "Second",
        created_at: 1.hour.ago)
      Current.tenant = nil

      get "/api/v1/sync_runs/#{sync_run.id}/sync_logs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body[0]["id"]).to eq(older.id)
      expect(response.parsed_body[1]["id"]).to eq(newer.id)
    end
  end
end
