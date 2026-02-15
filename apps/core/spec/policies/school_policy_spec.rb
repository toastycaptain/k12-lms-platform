require "rails_helper"

RSpec.describe SchoolPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:school, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits authenticated users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admin" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin" do
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:school1) { create(:school, tenant: tenant) }
    let!(:school2) { create(:school, tenant: tenant) }

    it "returns all schools for authenticated users" do
      scope = described_class::Scope.new(curriculum_lead, School).resolve
      expect(scope).to contain_exactly(school1, school2)
      expect(described_class::Scope.new(teacher, School).resolve).to contain_exactly(school1, school2)
      expect(described_class::Scope.new(student, School).resolve).to contain_exactly(school1, school2)
    end
  end
end
