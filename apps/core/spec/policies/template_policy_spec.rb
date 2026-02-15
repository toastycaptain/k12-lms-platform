require "rails_helper"

RSpec.describe TemplatePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:template, tenant: tenant, created_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits all roles" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :create?, :update?, :create_version?, :publish?, :archive? do
    it "permits admin and curriculum lead" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
    end

    it "denies teacher" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  permissions :destroy? do
    it "permits admin only" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(curriculum_lead, record)
    end
  end

  permissions :create_unit? do
    it "permits admin, curriculum lead, and teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:t1) { create(:template, tenant: tenant, created_by: admin) }
    let!(:t2) { create(:template, tenant: tenant, created_by: admin) }

    it "returns all records" do
      expect(described_class::Scope.new(student, Template).resolve).to contain_exactly(t1, t2)
    end
  end
end
