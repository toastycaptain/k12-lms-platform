require "rails_helper"

RSpec.describe AcademicYear, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should have_many(:terms).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:start_date) }
    it { should validate_presence_of(:end_date) }
    it { should validate_presence_of(:tenant_id) }

    it "validates end_date is after start_date" do
      tenant = create(:tenant)
      ay = build(:academic_year, tenant: tenant, start_date: Date.new(2026, 8, 1), end_date: Date.new(2026, 7, 1))
      expect(ay).not_to be_valid
      expect(ay.errors[:end_date]).to include("must be after start date")
    end

    it "allows valid date range" do
      tenant = create(:tenant)
      ay = build(:academic_year, tenant: tenant, start_date: Date.new(2026, 8, 1), end_date: Date.new(2027, 6, 30))
      expect(ay).to be_valid
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    before do
      Current.tenant = tenant1
      @ay1 = create(:academic_year, tenant: tenant1)

      Current.tenant = tenant2
      @ay2 = create(:academic_year, tenant: tenant2)
    end

    after { Current.tenant = nil }

    it "only returns academic years for the current tenant" do
      Current.tenant = tenant1
      expect(AcademicYear.all).to contain_exactly(@ay1)
    end
  end
end
