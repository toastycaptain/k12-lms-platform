require "rails_helper"

RSpec.describe District, type: :model do
  describe "associations" do
    it { should have_many(:tenants).dependent(:nullify) }
    it { should have_many(:schools).through(:tenants) }
  end

  describe "validations" do
    subject { build(:district) }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:slug) }
    it { should validate_uniqueness_of(:slug) }
  end

  it "rejects invalid slugs" do
    district = build(:district, slug: "Invalid Slug")
    expect(district).not_to be_valid
    expect(district.errors[:slug]).to be_present
  end
end
