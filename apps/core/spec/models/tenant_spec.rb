require "rails_helper"

RSpec.describe Tenant, type: :model do
  describe "associations" do
    it { should belong_to(:district).optional }
    it { should have_many(:schools).dependent(:destroy) }
  end

  describe "validations" do
    subject { build(:tenant) }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:slug) }
    it { should validate_uniqueness_of(:slug) }

    it "validates slug format" do
      tenant = build(:tenant, slug: "Invalid_Slug!")
      expect(tenant).not_to be_valid
      expect(tenant.errors[:slug]).to be_present
    end

    it "allows valid slug format" do
      tenant = build(:tenant, slug: "valid-slug-123")
      expect(tenant).to be_valid
    end
  end

  describe "settings" do
    it "defaults to empty hash" do
      tenant = Tenant.create!(name: "Test", slug: "test")
      expect(tenant.settings).to eq({})
    end

    it "stores and retrieves jsonb data" do
      tenant = Tenant.create!(name: "Test", slug: "test", settings: { theme: "dark", timezone: "UTC" })
      expect(tenant.reload.settings).to eq({ "theme" => "dark", "timezone" => "UTC" })
    end
  end
end
