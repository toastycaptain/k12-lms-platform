require "rails_helper"

RSpec.describe Quiz, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course) }
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:quiz_items).dependent(:destroy) }
    it { should have_many(:questions).through(:quiz_items) }
    it { should have_many(:quiz_attempts).dependent(:destroy) }
    it { should have_many(:quiz_accommodations).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:status).in_array(Quiz::VALID_STATUSES) }
    it { should validate_inclusion_of(:quiz_type).in_array(Quiz::VALID_QUIZ_TYPES) }
    it { should validate_inclusion_of(:show_results).in_array(Quiz::VALID_SHOW_RESULTS) }
    it { should validate_numericality_of(:attempts_allowed).is_greater_than(0) }
  end

  describe "state transitions" do
    it "publishes from draft" do
      quiz = create(:quiz, tenant: tenant, status: "draft")
      quiz.publish!
      expect(quiz.reload.status).to eq("published")
    end

    it "closes from published" do
      quiz = create(:quiz, tenant: tenant, status: "published")
      quiz.close!
      expect(quiz.reload.status).to eq("closed")
    end

    it "archives" do
      quiz = create(:quiz, tenant: tenant, status: "closed")
      quiz.archive!
      expect(quiz.reload.status).to eq("archived")
    end
  end

  describe "#calculate_points!" do
    it "sums quiz item points" do
      quiz = create(:quiz, tenant: tenant)
      q1 = create(:question, tenant: tenant)
      q2 = create(:question, tenant: tenant)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: q1, points: 2)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: q2, points: 3)

      quiz.calculate_points!
      expect(quiz.reload.points_possible).to eq(5)
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      q1 = create(:quiz, tenant: t1)
      Current.tenant = t2
      create(:quiz, tenant: t2)

      Current.tenant = t1
      expect(Quiz.all).to contain_exactly(q1)
    end
  end
end
