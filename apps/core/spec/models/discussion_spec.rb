require "rails_helper"

RSpec.describe Discussion, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course) }
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:discussion_posts).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:status).in_array(Discussion::VALID_STATUSES) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      d1 = create(:discussion, tenant: t1)
      Current.tenant = t2
      create(:discussion, tenant: t2)

      Current.tenant = t1
      expect(Discussion.all).to contain_exactly(d1)
    end
  end
end
