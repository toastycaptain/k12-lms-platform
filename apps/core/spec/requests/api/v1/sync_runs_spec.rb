require "rails_helper"

RSpec.describe "Api::V1::SyncRuns", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/integration_configs/:integration_config_id/sync_runs" do
    it "returns sync runs for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: admin)
      create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: admin,
        sync_type: "roster_sync")
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_runs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns only own sync runs for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: teacher)
      create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: admin)
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_runs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)

      get "/api/v1/integration_configs/#{integration_config.id}/sync_runs"

      expect(response).to have_http_status(:forbidden)
    end

    it "filters by status" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin, status: "completed")
      create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin, status: "failed")
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_runs",
        params: { status: "completed" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body[0]["status"]).to eq("completed")
    end

    it "filters by sync_type" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin, sync_type: "course_sync")
      create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin, sync_type: "roster_sync")
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_runs",
        params: { sync_type: "roster_sync" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body[0]["sync_type"]).to eq("roster_sync")
    end

    it "orders by created_at desc" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      older = create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin, created_at: 2.hours.ago)
      newer = create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin, created_at: 1.hour.ago)
      Current.tenant = nil

      get "/api/v1/integration_configs/#{integration_config.id}/sync_runs"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body[0]["id"]).to eq(newer.id)
      expect(response.parsed_body[1]["id"]).to eq(older.id)
    end
  end

  describe "GET /api/v1/sync_runs/:id" do
    it "shows a sync run for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      run = create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin)
      Current.tenant = nil

      get "/api/v1/sync_runs/#{run.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(run.id)
      expect(response.parsed_body["sync_type"]).to eq("course_sync")
      expect(response.parsed_body["direction"]).to eq("push")
      expect(response.parsed_body["status"]).to eq("pending")
    end

    it "shows a sync run for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      run = create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: teacher)
      Current.tenant = nil

      get "/api/v1/sync_runs/#{run.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(run.id)
    end

    it "returns 403 when teacher requests another user's sync run" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      run = create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin)
      Current.tenant = nil

      get "/api/v1/sync_runs/#{run.id}"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 for student" do
      mock_session(student, tenant: tenant)
      Current.tenant = tenant
      run = create(:sync_run, tenant: tenant, integration_config: integration_config,
        triggered_by: admin)
      Current.tenant = nil

      get "/api/v1/sync_runs/#{run.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
