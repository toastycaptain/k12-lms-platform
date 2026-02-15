require "rails_helper"

RSpec.describe AttemptAnswer, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:quiz_attempt) }
    it { should belong_to(:question) }
    it { should belong_to(:graded_by).class_name("User").optional }
  end

  describe "validations" do
    it "validates uniqueness of question scoped to quiz attempt" do
      quiz = create(:quiz, tenant: tenant, status: "published", attempts_allowed: 10)
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz)
      question = create(:question, tenant: tenant)
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question)
      duplicate = build(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:question_id]).to include("has already been taken")
    end
  end

  describe "#auto_grade!" do
    it "marks correct multiple choice answer and assigns points" do
      quiz = create(:quiz, tenant: tenant, status: "published", attempts_allowed: 10)
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz)
      question = create(:question, tenant: tenant, question_type: "multiple_choice", correct_answer: { "key" => "b" })
      quiz_item = create(:quiz_item, tenant: tenant, quiz: quiz, question: question, points: 2)
      answer = create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question, answer: { "key" => "b" })

      answer.auto_grade!(quiz_item)

      expect(answer.reload.is_correct).to eq(true)
      expect(answer.points_awarded).to eq(2)
      expect(answer.graded_at).to be_present
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      quiz1 = create(:quiz, tenant: t1, status: "published", attempts_allowed: 10)
      attempt1 = create(:quiz_attempt, tenant: t1, quiz: quiz1)
      question1 = create(:question, tenant: t1)
      a1 = create(:attempt_answer, tenant: t1, quiz_attempt: attempt1, question: question1)
      Current.tenant = t2
      quiz2 = create(:quiz, tenant: t2, status: "published", attempts_allowed: 10)
      attempt2 = create(:quiz_attempt, tenant: t2, quiz: quiz2)
      question2 = create(:question, tenant: t2)
      create(:attempt_answer, tenant: t2, quiz_attempt: attempt2, question: question2)

      Current.tenant = t1
      expect(AttemptAnswer.all).to contain_exactly(a1)
    end
  end
end
