require "rails_helper"

RSpec.describe AiInvocationPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:admin) do
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    user
  end
  let(:teacher) do
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end
  let(:other_teacher) do
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end
  let(:provider) { create(:ai_provider_config, tenant: tenant, created_by: admin) }
  let(:task_policy_record) { create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider) }
  let(:record) { create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: task_policy_record) }

  permissions :show? do
    it "permits the owning user" do
      expect(policy).to permit(teacher, record)
    end

    it "permits admin" do
      expect(policy).to permit(admin, record)
    end

    it "denies other users" do
      expect(policy).not_to permit(other_teacher, record)
    end
  end

  permissions :update? do
    it "permits the owning user" do
      expect(policy).to permit(teacher, record)
    end

    it "permits admin" do
      expect(policy).to permit(admin, record)
    end

    it "denies other users" do
      expect(policy).not_to permit(other_teacher, record)
    end
  end

  describe "Scope" do
    let!(:own_invocation) { create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: task_policy_record) }
    let!(:other_invocation) { create(:ai_invocation, tenant: tenant, user: other_teacher, ai_provider_config: provider, ai_task_policy: task_policy_record) }

    it "returns all for admin" do
      scope = AiInvocationPolicy::Scope.new(admin, AiInvocation).resolve

      expect(scope).to include(own_invocation, other_invocation)
    end

    it "returns only own for teacher" do
      scope = AiInvocationPolicy::Scope.new(teacher, AiInvocation).resolve

      expect(scope).to include(own_invocation)
      expect(scope).not_to include(other_invocation)
    end
  end
end
