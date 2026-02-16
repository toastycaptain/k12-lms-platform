require "rails_helper"

RSpec.describe QuestionBankPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:other_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:question_bank, tenant: tenant, created_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy?, :archive? do
    it "permits admin, curriculum lead, and teacher roles" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(other_teacher, record)
    end

    it "denies students" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:own_bank) { create(:question_bank, tenant: tenant, created_by: teacher) }
    let!(:other_bank) { create(:question_bank, tenant: tenant, created_by: other_teacher) }

    it "returns all for admin" do
      expect(described_class::Scope.new(admin, QuestionBank).resolve).to include(own_bank, other_bank)
    end

    it "returns all for teacher" do
      expect(described_class::Scope.new(teacher, QuestionBank).resolve).to include(own_bank, other_bank)
    end

    it "returns none for students" do
      expect(described_class::Scope.new(student, QuestionBank).resolve).to be_empty
    end
  end
end
