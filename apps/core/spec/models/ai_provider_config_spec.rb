require "rails_helper"

RSpec.describe AiProviderConfig, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:ai_task_policies).dependent(:destroy) }
  end

  describe "validations" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    subject { create(:ai_provider_config, tenant: tenant, created_by: create(:user, tenant: tenant)) }

    it { should validate_presence_of(:provider_name) }
    it { should validate_inclusion_of(:provider_name).in_array(AiProviderConfig::VALID_PROVIDER_NAMES) }
    it { should validate_presence_of(:display_name) }
    it { should validate_presence_of(:default_model) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(AiProviderConfig::VALID_STATUSES) }
    it { should validate_presence_of(:tenant_id) }

    it "validates uniqueness of provider_name per tenant" do
      create(:ai_provider_config, tenant: tenant, created_by: create(:user, tenant: tenant), provider_name: "openai")
      duplicate = build(:ai_provider_config, tenant: tenant, created_by: create(:user, tenant: tenant), provider_name: "openai")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:provider_name]).to include("has already been taken")
    end
  end

  describe "#activate!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "activates when api_key is present" do
      config = create(:ai_provider_config, tenant: tenant, created_by: create(:user, tenant: tenant), api_key: "sk-test")
      config.activate!
      expect(config.reload.status).to eq("active")
    end

    it "raises when api_key is blank" do
      config = create(:ai_provider_config, tenant: tenant, created_by: create(:user, tenant: tenant), api_key: nil)
      expect { config.activate! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "#deactivate!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to inactive" do
      config = create(:ai_provider_config, tenant: tenant, created_by: create(:user, tenant: tenant), status: "active", api_key: "sk-test")
      config.deactivate!
      expect(config.reload.status).to eq("inactive")
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    after { Current.tenant = nil }

    it "isolates records by tenant" do
      Current.tenant = tenant1
      create(:ai_provider_config, tenant: tenant1, created_by: create(:user, tenant: tenant1))

      Current.tenant = tenant2
      create(:ai_provider_config, tenant: tenant2, created_by: create(:user, tenant: tenant2))

      Current.tenant = tenant1
      expect(AiProviderConfig.count).to eq(1)
    end
  end
end
