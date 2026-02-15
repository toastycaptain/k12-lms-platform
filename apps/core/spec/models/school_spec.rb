require "rails_helper"

RSpec.describe School, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:timezone) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant, slug: "tenant-1") }
    let(:tenant2) { create(:tenant, slug: "tenant-2") }

    before do
      Current.tenant = tenant1
      @school1 = create(:school, name: "School 1", tenant: tenant1)

      Current.tenant = tenant2
      @school2 = create(:school, name: "School 2", tenant: tenant2)
    end

    after do
      Current.tenant = nil
    end

    it "only returns schools for the current tenant" do
      Current.tenant = tenant1
      expect(School.all).to contain_exactly(@school1)
      expect(School.count).to eq(1)
    end

    it "isolates queries between tenants" do
      Current.tenant = tenant2
      expect(School.all).to contain_exactly(@school2)
      expect(School.count).to eq(1)
    end

    it "automatically sets tenant_id on create" do
      Current.tenant = tenant1
      school = School.create!(name: "New School", timezone: "UTC")
      expect(school.tenant_id).to eq(tenant1.id)
    end

    it "returns all schools when no tenant is set" do
      Current.tenant = nil
      expect(School.unscoped.where(id: [@school1.id, @school2.id]).count).to eq(2)
    end
  end
end
