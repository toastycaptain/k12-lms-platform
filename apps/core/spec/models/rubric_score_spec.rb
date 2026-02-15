require "rails_helper"

RSpec.describe RubricScore, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:submission) }
    it { should belong_to(:rubric_criterion) }
    it { should belong_to(:rubric_rating).optional }
  end

  describe "validations" do
    it { should validate_presence_of(:points_awarded) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      s1 = create(:rubric_score, tenant: t1)
      Current.tenant = t2
      create(:rubric_score, tenant: t2)

      Current.tenant = t1
      expect(RubricScore.all).to contain_exactly(s1)
    end
  end
end
