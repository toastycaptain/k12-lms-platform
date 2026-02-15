require "rails_helper"

RSpec.describe AiProviderConfig, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:ai_task_policies).dependent(:restrict_with_error) }
    it { should have_many(:ai_invocations).dependent(:restrict_with_error) }
  end

  describe "validations" do
    it { should validate_presence_of(:display_name) }
    it { should validate_presence_of(:default_model) }
    it { should validate_inclusion_of(:status).in_array(AiProviderConfig::VALID_STATUSES) }
    it { should validate_inclusion_of(:provider_name).in_array(AiProviderConfig::VALID_PROVIDERS) }
  end

  describe "status methods" do
    let(:config) { create(:ai_provider_config, tenant: tenant, status: "inactive") }

    it "activates" do
      config.activate!
      expect(config.reload.status).to eq("active")
    end

    it "deactivates" do
      config.update!(status: "active")
      config.deactivate!
      expect(config.reload.status).to eq("inactive")
    end
  end

  describe "encryption" do
    it "stores api_key encrypted at rest" do
      config = create(:ai_provider_config, tenant: tenant, api_key: "secret-key")
      raw = config.reload.read_attribute_before_type_cast("api_key")

      expect(config.api_key).to eq("secret-key")
      expect(raw).not_to eq("secret-key")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      c1 = create(:ai_provider_config, tenant: t1)
      Current.tenant = t2
      create(:ai_provider_config, tenant: t2)

      Current.tenant = t1
      expect(AiProviderConfig.all).to contain_exactly(c1)
    end
  end
end
