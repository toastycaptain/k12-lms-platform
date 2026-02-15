require "rails_helper"

RSpec.describe CourseModulePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:course_module, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits all users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :create?, :update?, :publish?, :archive?, :reorder_items? do
    it "permits admin and teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student" do
      expect(policy).not_to permit(student, record)
    end
  end

  permissions :destroy? do
    it "permits admin only" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(teacher, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:m1) { create(:course_module, tenant: tenant) }
    let!(:m2) { create(:course_module, tenant: tenant) }

    it "returns all records" do
      expect(described_class::Scope.new(student, CourseModule).resolve).to contain_exactly(m1, m2)
    end
  end
end
