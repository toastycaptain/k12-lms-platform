require "rails_helper"

RSpec.describe OneRosterUserSyncJob, type: :job do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    u
  end
  let(:config) do
    create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
  end
  let(:mock_client) { instance_double(OneRosterClient) }

  before do
    Current.tenant = tenant
    # Force creation of admin and config before tests
    config
    allow(OneRosterClient).to receive(:new).and_return(mock_client)
  end

  after { Current.tenant = nil }

  describe "#perform" do
    it "creates User records from OneRoster users" do
      allow(mock_client).to receive(:get_all_users).and_return([
        {
          "sourcedId" => "u-1",
          "givenName" => "Jane",
          "familyName" => "Smith",
          "email" => "jane@school.edu",
          "role" => "teacher"
        }
      ])

      expect {
        described_class.new.perform(config.id, admin.id)
      }.to change(User, :count).by(1)

      user = User.find_by(email: "jane@school.edu")
      expect(user.first_name).to eq("Jane")
      expect(user.last_name).to eq("Smith")
      expect(user.has_role?(:teacher)).to be true
    end

    it "maps administrator role to admin" do
      allow(mock_client).to receive(:get_all_users).and_return([
        {
          "sourcedId" => "u-2",
          "givenName" => "Admin",
          "familyName" => "User",
          "email" => "admin-user@school.edu",
          "role" => "administrator"
        }
      ])

      described_class.new.perform(config.id, admin.id)

      user = User.find_by(email: "admin-user@school.edu")
      expect(user.has_role?(:admin)).to be true
    end

    it "skips users without email and logs warning" do
      allow(mock_client).to receive(:get_all_users).and_return([
        {
          "sourcedId" => "u-3",
          "givenName" => "No",
          "familyName" => "Email",
          "email" => nil,
          "role" => "student"
        }
      ])

      initial_count = User.count
      described_class.new.perform(config.id, admin.id)
      expect(User.count).to eq(initial_count)

      sync_run = SyncRun.last
      expect(sync_run.sync_logs.where(level: "warn").count).to eq(1)
    end

    it "updates existing user when SyncMapping exists" do
      user = create(:user, tenant: tenant, email: "existing@school.edu", first_name: "Old")
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "User", local_id: user.id,
        external_id: "u-1", external_type: "oneroster_user"
      )

      allow(mock_client).to receive(:get_all_users).and_return([
        {
          "sourcedId" => "u-1",
          "givenName" => "New",
          "familyName" => "Name",
          "email" => "existing@school.edu",
          "role" => "teacher"
        }
      ])

      described_class.new.perform(config.id, admin.id)

      expect(user.reload.first_name).to eq("New")
    end

    it "creates a completed SyncRun" do
      allow(mock_client).to receive(:get_all_users).and_return([])

      described_class.new.perform(config.id, admin.id)

      sync_run = SyncRun.last
      expect(sync_run.sync_type).to eq("oneroster_user_sync")
      expect(sync_run.status).to eq("completed")
    end
  end
end
