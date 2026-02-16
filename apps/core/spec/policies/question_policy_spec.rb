require "rails_helper"

RSpec.describe QuestionPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:question, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy? do
    it "permits content creators" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:q1) { create(:question, tenant: tenant) }
    let!(:q2) { create(:question, tenant: tenant) }

    it "returns all records for content creators" do
      expect(described_class::Scope.new(teacher, Question).resolve).to contain_exactly(q1, q2)
    end

    it "returns none for students" do
      expect(described_class::Scope.new(student, Question).resolve).to be_empty
    end
  end
end
