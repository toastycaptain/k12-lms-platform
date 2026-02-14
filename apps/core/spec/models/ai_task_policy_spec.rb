require "rails_helper"

RSpec.describe AiTaskPolicy, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:ai_provider_config) }
    it { should belong_to(:created_by).class_name("User") }
  end

  describe "validations" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it { should validate_presence_of(:task_type) }
    it { should validate_inclusion_of(:task_type).in_array(AiTaskPolicy::VALID_TASK_TYPES) }

    it "validates uniqueness of task_type per tenant" do
      user = create(:user, tenant: tenant)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user)
      create(:ai_task_policy, tenant: tenant, created_by: user, ai_provider_config: provider, task_type: "lesson_generation")
      duplicate = build(:ai_task_policy, tenant: tenant, created_by: user, ai_provider_config: provider, task_type: "lesson_generation")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:task_type]).to include("has already been taken")
    end
  end

  describe "#allowed_for?" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "returns true for user with allowed role" do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user)
      policy = create(:ai_task_policy, tenant: tenant, created_by: user,
        ai_provider_config: provider, allowed_roles: [ "teacher" ], enabled: true)

      expect(policy.allowed_for?(user)).to be true
    end

    it "returns false for user without allowed role" do
      user = create(:user, tenant: tenant)
      user.add_role(:student)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user)
      policy = create(:ai_task_policy, tenant: tenant, created_by: user,
        ai_provider_config: provider, allowed_roles: [ "teacher" ], enabled: true)

      expect(policy.allowed_for?(user)).to be false
    end

    it "returns false when disabled" do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user)
      policy = create(:ai_task_policy, tenant: tenant, created_by: user,
        ai_provider_config: provider, allowed_roles: [ "teacher" ], enabled: false)

      expect(policy.allowed_for?(user)).to be false
    end
  end

  describe "#effective_model" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "returns model_override when present" do
      user = create(:user, tenant: tenant)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user, default_model: "gpt-4o")
      policy = create(:ai_task_policy, tenant: tenant, created_by: user,
        ai_provider_config: provider, model_override: "gpt-4o-mini")

      expect(policy.effective_model).to eq("gpt-4o-mini")
    end

    it "returns provider default when no override" do
      user = create(:user, tenant: tenant)
      provider = create(:ai_provider_config, tenant: tenant, created_by: user, default_model: "gpt-4o")
      policy = create(:ai_task_policy, tenant: tenant, created_by: user,
        ai_provider_config: provider, model_override: nil)

      expect(policy.effective_model).to eq("gpt-4o")
    end
  end
end
