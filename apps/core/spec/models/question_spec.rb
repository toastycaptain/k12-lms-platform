require "rails_helper"

RSpec.describe Question, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:question_bank) }
    it { should belong_to(:created_by).class_name("User") }
  end

  describe "validations" do
    it { should validate_presence_of(:prompt) }
    it { should validate_inclusion_of(:question_type).in_array(Question::VALID_TYPES) }
    it { should validate_inclusion_of(:status).in_array(Question::VALID_STATUSES) }
    it { should validate_numericality_of(:points).is_greater_than(0) }
  end

  describe "#auto_gradable?" do
    it "returns true for auto gradable types" do
      question = build(:question, tenant: tenant, question_type: "multiple_choice")
      expect(question.auto_gradable?).to eq(true)
    end

    it "returns false for essay" do
      question = build(:question, :essay, tenant: tenant)
      expect(question.auto_gradable?).to eq(false)
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      q1 = create(:question, tenant: t1)
      Current.tenant = t2
      create(:question, tenant: t2)

      Current.tenant = t1
      expect(Question.all).to contain_exactly(q1)
    end
  end
end
