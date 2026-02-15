require "rails_helper"

RSpec.describe AiTaskPolicyPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy? do
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
    let(:provider) { create(:ai_provider_config, tenant: tenant, created_by: admin) }
    let(:record) { create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider) }

    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(teacher, record)
    end
  end
end
