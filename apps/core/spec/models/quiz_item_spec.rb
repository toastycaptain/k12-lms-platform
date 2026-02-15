require "rails_helper"

RSpec.describe QuizItem, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:quiz) }
    it { should belong_to(:question) }
  end

  describe "validations" do
    it { should validate_numericality_of(:points).is_greater_than(0) }
  end

  describe "callbacks" do
    it "recalculates quiz points on save and destroy" do
      quiz = create(:quiz, tenant: tenant)
      question = create(:question, tenant: tenant)

      item = create(:quiz_item, tenant: tenant, quiz: quiz, question: question, points: 4)
      expect(quiz.reload.points_possible).to eq(4)

      item.destroy!
      expect(quiz.reload.points_possible).to eq(0)
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      i1 = create(:quiz_item, tenant: t1)
      Current.tenant = t2
      create(:quiz_item, tenant: t2)

      Current.tenant = t1
      expect(QuizItem.all).to contain_exactly(i1)
    end
  end
end
