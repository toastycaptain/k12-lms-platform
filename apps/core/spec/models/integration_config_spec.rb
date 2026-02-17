require "rails_helper"

RSpec.describe IntegrationConfig, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:sync_mappings).dependent(:destroy) }
    it { should have_many(:sync_runs).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_inclusion_of(:provider).in_array(IntegrationConfig::VALID_PROVIDERS) }
    it { should validate_inclusion_of(:status).in_array(IntegrationConfig::VALID_STATUSES) }

    it "enforces provider uniqueness within a tenant" do
      creator = create(:user, tenant: tenant)
      create(:integration_config, tenant: tenant, created_by: creator, provider: "google_classroom")
      duplicate = build(:integration_config, tenant: tenant, created_by: creator, provider: "google_classroom")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:provider]).to include("has already been taken")
    end

    it "allows same provider in a different tenant" do
      creator = create(:user, tenant: tenant)
      other_tenant = create(:tenant)
      other_creator = create(:user, tenant: other_tenant)

      create(:integration_config, tenant: tenant, created_by: creator, provider: "google_classroom")
      same_provider_other_tenant = build(:integration_config, tenant: other_tenant, created_by: other_creator, provider: "google_classroom")

      expect(same_provider_other_tenant).to be_valid
    end
  end

  describe "activation methods" do
    it "activates when settings is a hash" do
      config = create(:integration_config, tenant: tenant, status: "inactive", settings: { "sync_enabled" => true })

      config.activate!

      expect(config.reload.status).to eq("active")
    end

    it "raises when settings is blank" do
      config = create(:integration_config, tenant: tenant, status: "inactive", settings: {})

      expect { config.activate! }.to raise_error(ActiveRecord::RecordInvalid)
      expect(config.errors[:settings]).to include("must be configured before activation")
    end

    it "raises when settings is not a hash" do
      config = create(:integration_config, tenant: tenant, status: "inactive", settings: {})
      config.settings = "bad"

      expect { config.activate! }.to raise_error(ActiveRecord::RecordInvalid)
      expect(config.errors[:settings]).to include("must be configured before activation")
    end

    it "deactivates" do
      config = create(:integration_config, tenant: tenant, status: "active")

      config.deactivate!

      expect(config.reload.status).to eq("inactive")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      c1 = create(:integration_config, tenant: t1)
      Current.tenant = t2
      create(:integration_config, tenant: t2, provider: "oneroster")

      Current.tenant = t1
      expect(IntegrationConfig.all).to contain_exactly(c1)
    end
  end
end
