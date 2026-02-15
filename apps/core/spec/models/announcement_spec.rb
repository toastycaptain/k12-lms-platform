require "rails_helper"

RSpec.describe Announcement, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course) }
    it { should belong_to(:created_by).class_name("User") }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:message) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      a1 = create(:announcement, tenant: t1)
      Current.tenant = t2
      create(:announcement, tenant: t2)

      Current.tenant = t1
      expect(Announcement.all).to contain_exactly(a1)
    end
  end
end
