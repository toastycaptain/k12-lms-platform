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
  end

  describe "activation methods" do
    it "activates when settings is a hash" do
      config = create(:integration_config, tenant: tenant, status: "inactive", settings: { "ok" => true })
      config.activate!
      expect(config.reload.status).to eq("active")
    end

    it "raises when settings is blank" do
      config = create(:integration_config, tenant: tenant, status: "inactive", settings: {})
      expect { config.activate! }.to raise_error(ActiveRecord::RecordInvalid)
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
