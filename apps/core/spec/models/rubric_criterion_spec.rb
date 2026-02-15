require "rails_helper"

RSpec.describe RubricCriterion, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:rubric) }
    it { should have_many(:rubric_ratings).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:points) }
    it { should validate_numericality_of(:points).is_greater_than(0) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      c1 = create(:rubric_criterion, tenant: t1)
      Current.tenant = t2
      create(:rubric_criterion, tenant: t2)

      Current.tenant = t1
      expect(RubricCriterion.all).to contain_exactly(c1)
    end
  end
end
