require "rails_helper"

RSpec.describe Enrollment, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:user) }
    it { should belong_to(:section) }
  end

  describe "validations" do
    it { should validate_presence_of(:role) }
    it { should validate_presence_of(:tenant_id) }

    it "validates role is teacher or student" do
      tenant = create(:tenant)
      Current.tenant = tenant
      user = create(:user, tenant: tenant)
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      section = create(:section, tenant: tenant, course: course, term: term)

      enrollment = build(:enrollment, tenant: tenant, user: user, section: section, role: "invalid")
      expect(enrollment).not_to be_valid

      enrollment.role = "student"
      expect(enrollment).to be_valid

      enrollment.role = "teacher"
      expect(enrollment).to be_valid
      Current.tenant = nil
    end

    it "prevents duplicate enrollment of same user in same section" do
      tenant = create(:tenant)
      Current.tenant = tenant
      user = create(:user, tenant: tenant)
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      term = create(:term, tenant: tenant, academic_year: ay)
      section = create(:section, tenant: tenant, course: course, term: term)

      create(:enrollment, tenant: tenant, user: user, section: section, role: "student")
      duplicate = build(:enrollment, tenant: tenant, user: user, section: section, role: "teacher")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:user_id]).to include("already enrolled in this section")
      Current.tenant = nil
    end
  end
end
