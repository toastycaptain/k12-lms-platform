require "rails_helper"

RSpec.describe LtiResourceLink, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:lti_registration) }
    it { should belong_to(:course).optional }
  end

  describe "validations" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it { should validate_presence_of(:title) }
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    after { Current.tenant = nil }

    it "isolates records by tenant" do
      Current.tenant = tenant1
      reg1 = create(:lti_registration, tenant: tenant1, created_by: create(:user, tenant: tenant1))
      create(:lti_resource_link, tenant: tenant1, lti_registration: reg1)

      Current.tenant = tenant2
      reg2 = create(:lti_registration, tenant: tenant2, created_by: create(:user, tenant: tenant2))
      create(:lti_resource_link, tenant: tenant2, lti_registration: reg2)

      Current.tenant = tenant1
      expect(LtiResourceLink.count).to eq(1)
    end
  end
end
