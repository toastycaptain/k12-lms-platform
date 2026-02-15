require "rails_helper"

RSpec.describe StandardPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:record) { create(:standard, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :tree? do
    it "permits all roles" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end
  end

  permissions :create?, :update? do
    it "permits admin and curriculum lead" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
    end

    it "denies teacher" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  permissions :destroy? do
    it "permits only admin" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:s1) { create(:standard, tenant: tenant) }
    let!(:s2) { create(:standard, tenant: tenant) }

    it "returns all records" do
      expect(described_class::Scope.new(teacher, Standard).resolve).to contain_exactly(s1, s2)
    end
  end
end
