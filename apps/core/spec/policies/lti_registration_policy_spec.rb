require "rails_helper"

RSpec.describe LtiRegistrationPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy?, :activate?, :deactivate? do
    let(:record) { create(:lti_registration, tenant: tenant, created_by: admin) }
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

    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:registration) { create(:lti_registration, tenant: tenant, created_by: admin) }
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

    it "returns records for admins" do
      scope = LtiRegistrationPolicy::Scope.new(admin, LtiRegistration).resolve
      expect(scope).to include(registration)
    end

    it "returns no records for non-admin users" do
      scope = LtiRegistrationPolicy::Scope.new(teacher, LtiRegistration).resolve
      expect(scope).to be_empty
    end
  end
end
