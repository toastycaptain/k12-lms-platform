require "rails_helper"

RSpec.describe AuditLogger do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe ".log" do
    it "creates an audit log entry" do
      Current.user = user

      expect {
        described_class.log(action: :create, auditable: user, changes: { email: "new@example.com" })
      }.to change(AuditLog, :count).by(1)

      log = AuditLog.last
      expect(log.action).to eq("create")
      expect(log.auditable_type).to eq("User")
      expect(log.auditable_id).to eq(user.id)
      expect(log.user).to eq(user)
      expect(log.changes_data).to eq({ "email" => "new@example.com" })
    end

    it "extracts ip_address and user_agent from request" do
      Current.user = user
      mock_request = double("request", remote_ip: "10.0.0.1", user_agent: "TestBot/1.0")

      described_class.log(action: :update, request: mock_request)

      log = AuditLog.last
      expect(log.ip_address).to eq("10.0.0.1")
      expect(log.user_agent).to eq("TestBot/1.0")
    end

    it "works without a user" do
      Current.user = nil

      expect {
        described_class.log(action: :sync, metadata: { source: "cron" })
      }.to change(AuditLog, :count).by(1)

      expect(AuditLog.last.user).to be_nil
    end
  end
end
