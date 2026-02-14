require "rails_helper"

RSpec.describe StandardFramework, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should have_many(:standards).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    before do
      Current.tenant = tenant1
      @sf1 = create(:standard_framework, tenant: tenant1)

      Current.tenant = tenant2
      @sf2 = create(:standard_framework, tenant: tenant2)
    end

    after { Current.tenant = nil }

    it "only returns frameworks for the current tenant" do
      Current.tenant = tenant1
      expect(StandardFramework.all).to contain_exactly(@sf1)
    end
  end
end
