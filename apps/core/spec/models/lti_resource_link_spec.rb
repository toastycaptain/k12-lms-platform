require "rails_helper"

RSpec.describe LtiResourceLink, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:lti_registration) }
    it { should belong_to(:course).optional }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      l1 = create(:lti_resource_link, tenant: t1)
      Current.tenant = t2
      create(:lti_resource_link, tenant: t2)

      Current.tenant = t1
      expect(LtiResourceLink.all).to contain_exactly(l1)
    end
  end
end
