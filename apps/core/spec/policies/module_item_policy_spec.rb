require "rails_helper"

RSpec.describe ModuleItemPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:module_item, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits all users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admin and teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:i1) { create(:module_item, tenant: tenant) }
    let!(:i2) { create(:module_item, tenant: tenant) }

    it "returns all records" do
      expect(described_class::Scope.new(student, ModuleItem).resolve).to contain_exactly(i1, i2)
    end
  end
end
