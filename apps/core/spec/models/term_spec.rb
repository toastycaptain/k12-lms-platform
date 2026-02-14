require "rails_helper"

RSpec.describe Term, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:academic_year) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:start_date) }
    it { should validate_presence_of(:end_date) }
    it { should validate_presence_of(:tenant_id) }

    it "validates end_date is after start_date" do
      tenant = create(:tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      term = build(:term, tenant: tenant, academic_year: ay, start_date: Date.new(2026, 12, 1), end_date: Date.new(2026, 8, 1))
      expect(term).not_to be_valid
      expect(term.errors[:end_date]).to include("must be after start date")
      Current.tenant = nil
    end

    it "allows valid date range" do
      tenant = create(:tenant)
      Current.tenant = tenant
      ay = create(:academic_year, tenant: tenant)
      term = build(:term, tenant: tenant, academic_year: ay, start_date: Date.new(2026, 8, 1), end_date: Date.new(2026, 12, 20))
      expect(term).to be_valid
      Current.tenant = nil
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    before do
      Current.tenant = tenant1
      ay1 = create(:academic_year, tenant: tenant1)
      @term1 = create(:term, tenant: tenant1, academic_year: ay1)

      Current.tenant = tenant2
      ay2 = create(:academic_year, tenant: tenant2)
      @term2 = create(:term, tenant: tenant2, academic_year: ay2)
    end

    after { Current.tenant = nil }

    it "only returns terms for the current tenant" do
      Current.tenant = tenant1
      expect(Term.all).to contain_exactly(@term1)
    end
  end
end
