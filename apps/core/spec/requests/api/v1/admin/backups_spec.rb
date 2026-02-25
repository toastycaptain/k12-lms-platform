require "rails_helper"

RSpec.describe "Api::V1::Admin::Backups", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/admin/backups" do
    it "returns backup records for admins" do
      mock_session(admin, tenant: tenant)
      BackupRecord.create!(
        backup_type: "full",
        status: "completed",
        s3_key: "backups/test.sql.gz",
        s3_bucket: "test-bucket"
      )

      get "/api/v1/admin/backups"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/admin/backups"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/admin/backups" do
    it "enqueues a backup job for admins" do
      mock_session(admin, tenant: tenant)

      expect do
        post "/api/v1/admin/backups", params: { backup_type: "full" }
      end.to have_enqueued_job(DatabaseBackupJob)

      expect(response).to have_http_status(:accepted)
    end
  end

  describe "GET /api/v1/admin/backups/status" do
    it "returns a backup status summary" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/backups/status"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("total_backups")
    end
  end
end
