require "rails_helper"

RSpec.describe LessonPlanPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:owner_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:other_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:record) do
    unit_plan = create(:unit_plan, tenant: tenant, created_by: owner_teacher)
    create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: owner_teacher)
  end

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits all roles" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(owner_teacher, record)
    end
  end

  permissions :create? do
    it "permits admin, curriculum lead, and teachers" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(owner_teacher, record)
    end
  end

  permissions :update?, :destroy?, :create_version? do
    it "permits admin and owner teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(owner_teacher, record)
    end

    it "denies non-owner teacher" do
      expect(policy).not_to permit(other_teacher, record)
    end
  end

  describe "Scope" do
    let!(:lp1) { create(:lesson_plan, tenant: tenant, created_by: owner_teacher) }
    let!(:lp2) { create(:lesson_plan, tenant: tenant, created_by: owner_teacher) }

    it "returns all records" do
      expect(described_class::Scope.new(other_teacher, LessonPlan).resolve).to contain_exactly(lp1, lp2)
    end
  end
end
