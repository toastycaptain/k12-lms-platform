require "rails_helper"

RSpec.describe AiInvocation, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:user) }
    it { should belong_to(:ai_provider_config) }
    it { should belong_to(:ai_task_policy).optional }
    it { should belong_to(:ai_template).optional }
  end

  describe "validations" do
    it { should validate_presence_of(:task_type) }
    it { should validate_presence_of(:provider_name) }
    it { should validate_presence_of(:model) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(AiInvocation::VALID_STATUSES) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "#start!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to running and started_at" do
      user = create(:user, tenant: tenant)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user)
      invocation = create(:ai_invocation, tenant: tenant, user: user, ai_provider_config: provider)

      invocation.start!

      expect(invocation.status).to eq("running")
      expect(invocation.started_at).to be_present
    end
  end

  describe "#complete!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to completed with usage data" do
      user = create(:user, tenant: tenant)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user)
      invocation = create(:ai_invocation, tenant: tenant, user: user, ai_provider_config: provider)
      invocation.start!

      invocation.complete!(prompt_tokens: 100, completion_tokens: 200, total_tokens: 300)

      expect(invocation.status).to eq("completed")
      expect(invocation.prompt_tokens).to eq(100)
      expect(invocation.completion_tokens).to eq(200)
      expect(invocation.total_tokens).to eq(300)
      expect(invocation.completed_at).to be_present
      expect(invocation.duration_ms).to be_present
    end
  end

  describe "#fail!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to failed with error message" do
      user = create(:user, tenant: tenant)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user)
      invocation = create(:ai_invocation, tenant: tenant, user: user, ai_provider_config: provider)
      invocation.start!

      invocation.fail!("API rate limit exceeded")

      expect(invocation.status).to eq("failed")
      expect(invocation.error_message).to eq("API rate limit exceeded")
      expect(invocation.completed_at).to be_present
      expect(invocation.duration_ms).to be_present
    end
  end
end
