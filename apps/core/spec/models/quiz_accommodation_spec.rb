require "rails_helper"

RSpec.describe QuizAccommodation, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:quiz) }
    it { should belong_to(:user) }
  end

  describe "validations" do
    it { should validate_numericality_of(:extra_time_minutes).is_greater_than_or_equal_to(0) }
    it { should validate_numericality_of(:extra_attempts).is_greater_than_or_equal_to(0) }

    it "validates uniqueness of user scoped to quiz" do
      quiz = create(:quiz, tenant: tenant)
      user = create(:user, tenant: tenant)
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: user)
      dup = build(:quiz_accommodation, tenant: tenant, quiz: quiz, user: user)

      expect(dup).not_to be_valid
      expect(dup.errors[:user_id]).to include("has already been taken")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      a1 = create(:quiz_accommodation, tenant: t1)
      Current.tenant = t2
      create(:quiz_accommodation, tenant: t2)

      Current.tenant = t1
      expect(QuizAccommodation.all).to contain_exactly(a1)
    end
  end
end
