require "rails_helper"

RSpec.describe StandardFramework, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should have_many(:standards).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:tenant_id) }

    it "defaults framework_kind when blank" do
      tenant = create(:tenant)
      Current.tenant = tenant
      record = build(:standard_framework, tenant: tenant, framework_kind: "")
      record.validate

      expect(record.framework_kind).to eq("standard")
    ensure
      Current.tenant = nil
    end

    it "defaults status when blank" do
      tenant = create(:tenant)
      Current.tenant = tenant
      record = build(:standard_framework, tenant: tenant, status: "")
      record.validate

      expect(record.status).to eq("active")
    ensure
      Current.tenant = nil
    end
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

  describe "key uniqueness" do
    let(:tenant) { create(:tenant) }

    it "enforces unique key within a tenant" do
      Current.tenant = tenant
      create(:standard_framework, tenant: tenant, key: "ccss_ela")

      duplicate = build(:standard_framework, tenant: tenant, key: "ccss_ela")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:key]).to be_present
    ensure
      Current.tenant = nil
    end
  end
end
