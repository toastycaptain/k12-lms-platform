require "rails_helper"

RSpec.describe AiProviderConfigPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy?, :activate?, :deactivate? do
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
    let(:record) { create(:ai_provider_config, tenant: tenant, created_by: admin) }

    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(teacher, record)
    end
  end
end
