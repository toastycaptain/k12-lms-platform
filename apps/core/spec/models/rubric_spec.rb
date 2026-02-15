require "rails_helper"

RSpec.describe Rubric, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:rubric_criteria).dependent(:destroy) }
    it { should have_many(:assignments) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      r1 = create(:rubric, tenant: t1)
      Current.tenant = t2
      create(:rubric, tenant: t2)

      Current.tenant = t1
      expect(Rubric.all).to contain_exactly(r1)
    end
  end
end
