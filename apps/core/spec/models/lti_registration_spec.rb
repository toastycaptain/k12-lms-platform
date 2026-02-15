require "rails_helper"

RSpec.describe LtiRegistration, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:lti_resource_links).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:issuer) }
    it { should validate_presence_of(:client_id) }
    it { should validate_presence_of(:deployment_id) }
    it { should validate_presence_of(:auth_login_url) }
    it { should validate_presence_of(:auth_token_url) }
    it { should validate_presence_of(:jwks_url) }
    it { should validate_inclusion_of(:status).in_array(LtiRegistration::VALID_STATUSES) }
  end

  describe "status transitions" do
    let(:registration) { create(:lti_registration, tenant: tenant, status: "inactive") }

    it "activates" do
      registration.activate!
      expect(registration.reload.status).to eq("active")
    end

    it "deactivates" do
      registration.update!(status: "active")
      registration.deactivate!
      expect(registration.reload.status).to eq("inactive")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      r1 = create(:lti_registration, tenant: t1)
      Current.tenant = t2
      create(:lti_registration, tenant: t2)

      Current.tenant = t1
      expect(LtiRegistration.all).to contain_exactly(r1)
    end
  end
end
