require "rails_helper"

RSpec.describe GuardianPolicy, type: :policy do
  let(:tenant) { create(:tenant) }

  let(:guardian) do
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end

  let(:student) do
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  let(:unlinked_guardian) do
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end

  before do
    create(:guardian_link, tenant: tenant, guardian: guardian, student: student, status: "active")
  end

  permissions :index? do
    it "permits guardian users" do
      expect(described_class).to permit(guardian, :guardian)
    end

    it "denies non-guardian users" do
      expect(described_class).not_to permit(create(:user, tenant: tenant), :guardian)
    end
  end

  permissions :show? do
    it "permits linked guardians" do
      expect(described_class).to permit(guardian, student)
    end

    it "denies guardians without an active link" do
      expect(described_class).not_to permit(unlinked_guardian, student)
    end
  end

  describe "scope" do
    it "returns only linked students" do
      other_student = create(:user, tenant: tenant)
      other_student.add_role(:student)

      scope = described_class::Scope.new(guardian, User).resolve

      expect(scope).to contain_exactly(student)
    end
  end
end
