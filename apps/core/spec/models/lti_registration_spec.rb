require "rails_helper"

RSpec.describe LtiRegistration, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:created_by).class_name("User") }
    it { should have_many(:lti_resource_links).dependent(:destroy) }
  end

  describe "validations" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:issuer) }
    it { should validate_presence_of(:client_id) }
    it { should validate_presence_of(:auth_login_url) }
    it { should validate_presence_of(:auth_token_url) }
    it { should validate_presence_of(:jwks_url) }
    it { should validate_presence_of(:deployment_id) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(LtiRegistration::VALID_STATUSES) }
  end

  describe "#activate!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to active" do
      reg = create(:lti_registration, tenant: tenant, created_by: create(:user, tenant: tenant))
      reg.activate!
      expect(reg.reload.status).to eq("active")
    end
  end

  describe "#deactivate!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "sets status to inactive" do
      reg = create(:lti_registration, tenant: tenant, created_by: create(:user, tenant: tenant), status: "active")
      reg.deactivate!
      expect(reg.reload.status).to eq("inactive")
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    after { Current.tenant = nil }

    it "isolates records by tenant" do
      Current.tenant = tenant1
      create(:lti_registration, tenant: tenant1, created_by: create(:user, tenant: tenant1))

      Current.tenant = tenant2
      create(:lti_registration, tenant: tenant2, created_by: create(:user, tenant: tenant2))

      Current.tenant = tenant1
      expect(LtiRegistration.count).to eq(1)
    end
  end
end
