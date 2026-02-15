require "rails_helper"

RSpec.describe AiTaskPolicy, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:ai_provider_config) }
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:ai_invocations).dependent(:nullify) }
  end

  describe "validations" do
    it { should validate_inclusion_of(:task_type).in_array(AiTaskPolicy::VALID_TASK_TYPES) }
    it { should validate_numericality_of(:max_tokens_limit).is_greater_than(0).allow_nil }
    it { should validate_numericality_of(:temperature_limit).is_greater_than_or_equal_to(0).is_less_than_or_equal_to(2).allow_nil }
  end

  describe "custom methods" do
    let(:provider) { create(:ai_provider_config, tenant: tenant, default_model: "base-model") }
    let(:policy_record) do
      create(:ai_task_policy,
        tenant: tenant,
        ai_provider_config: provider,
        allowed_roles: [ "teacher" ],
        model_override: "override-model")
    end

    it "checks allowed role" do
      expect(policy_record.allowed_for_role?("teacher")).to eq(true)
      expect(policy_record.allowed_for_role?("student")).to eq(false)
    end

    it "returns effective model" do
      expect(policy_record.effective_model).to eq("override-model")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      p1 = create(:ai_task_policy, tenant: t1)
      Current.tenant = t2
      create(:ai_task_policy, tenant: t2, task_type: "assessment")

      Current.tenant = t1
      expect(AiTaskPolicy.all).to contain_exactly(p1)
    end
  end
end
