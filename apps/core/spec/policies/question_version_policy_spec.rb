require "rails_helper"

RSpec.describe QuestionVersionPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    user
  end

  let(:curriculum_lead) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:curriculum_lead)
    user
  end

  let(:owner_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end

  let(:other_teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  let(:question_bank) { create(:question_bank, tenant: tenant, created_by: owner_teacher) }
  let(:question) { create(:question, tenant: tenant, question_bank: question_bank, created_by: owner_teacher) }
  let(:record) { create(:question_version, tenant: tenant, question: question, created_by: owner_teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits admins and curriculum leads" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
    end

    it "permits owning teacher and denies unrelated teacher" do
      expect(policy).to permit(owner_teacher, record)
      expect(policy).not_to permit(other_teacher, record)
    end

    it "denies students" do
      expect(policy).not_to permit(student, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admins, curriculum leads, and owning teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(owner_teacher, record)
    end

    it "denies unrelated teacher and student" do
      expect(policy).not_to permit(other_teacher, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:owned_version) { create(:question_version, tenant: tenant, question: question, created_by: owner_teacher) }

    it "returns all records for admin users" do
      expect(described_class::Scope.new(admin, QuestionVersion).resolve).to include(owned_version)
    end

    it "returns owned records for teacher users" do
      scope = described_class::Scope.new(owner_teacher, QuestionVersion).resolve
      expect(scope).to include(owned_version)
    end

    it "returns no records for students" do
      expect(described_class::Scope.new(student, QuestionVersion).resolve).to be_empty
    end
  end
end
