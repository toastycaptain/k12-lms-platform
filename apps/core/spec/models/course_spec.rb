require "rails_helper"

RSpec.describe Course, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:academic_year) }
    it { should have_many(:sections).dependent(:destroy) }
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
      ay1 = create(:academic_year, tenant: tenant1)
      @course1 = create(:course, tenant: tenant1, academic_year: ay1)

      Current.tenant = tenant2
      ay2 = create(:academic_year, tenant: tenant2)
      @course2 = create(:course, tenant: tenant2, academic_year: ay2)
    end

    after { Current.tenant = nil }

    it "only returns courses for the current tenant" do
      Current.tenant = tenant1
      expect(Course.all).to contain_exactly(@course1)
    end
  end
end
