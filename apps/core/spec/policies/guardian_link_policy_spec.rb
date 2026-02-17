require "rails_helper"

RSpec.describe GuardianLinkPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    user
  end
  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end
  let(:student) { create(:user, tenant: tenant) }
  let(:record) { create(:guardian_link, tenant: tenant, guardian: guardian, student: student) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits admin and guardian users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(guardian, record)
    end

    it "denies unrelated users" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  permissions :show? do
    it "permits admin and owning guardian" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(guardian, record)
    end

    it "denies unrelated users" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admin only" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(guardian, record)
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:owned_link) { create(:guardian_link, tenant: tenant, guardian: guardian, student: create(:user, tenant: tenant)) }
    let!(:other_link) { create(:guardian_link, tenant: tenant) }

    it "returns all links for admin" do
      scope = described_class::Scope.new(admin, GuardianLink).resolve
      expect(scope).to include(owned_link, other_link)
    end

    it "returns only owned links for guardians" do
      scope = described_class::Scope.new(guardian, GuardianLink).resolve
      expect(scope).to contain_exactly(owned_link)
    end

    it "returns no records for non-guardian users" do
      scope = described_class::Scope.new(teacher, GuardianLink).resolve
      expect(scope).to be_empty
    end
  end
end
