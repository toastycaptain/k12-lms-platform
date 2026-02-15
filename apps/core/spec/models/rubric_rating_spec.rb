require "rails_helper"

RSpec.describe RubricRating, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:rubric_criterion) }
  end

  describe "validations" do
    it { should validate_presence_of(:description) }
    it { should validate_presence_of(:points) }
    it { should validate_numericality_of(:points).is_greater_than_or_equal_to(0) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      r1 = create(:rubric_rating, tenant: t1)
      Current.tenant = t2
      create(:rubric_rating, tenant: t2)

      Current.tenant = t1
      expect(RubricRating.all).to contain_exactly(r1)
    end
  end
end
