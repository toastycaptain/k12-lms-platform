require "rails_helper"

RSpec.describe UnitPlan, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:course) }
    it { should belong_to(:created_by).class_name("User") }
    it { should belong_to(:current_version).class_name("UnitVersion").optional }
    it { should have_many(:unit_versions).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:status) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "#create_version!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "creates a new version with auto-incremented version_number" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)

      v1 = unit_plan.create_version!(title: "First Draft")
      expect(v1.version_number).to eq(1)

      v2 = unit_plan.create_version!(title: "Revised")
      expect(v2.version_number).to eq(2)
    end

    it "sets the current_version on the unit plan" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)

      version = unit_plan.create_version!(title: "Draft")
      expect(unit_plan.reload.current_version).to eq(version)
    end
  end

  describe "#publish!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "transitions status from draft to published" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user, status: "draft")
      unit_plan.create_version!(title: "v1")

      unit_plan.publish!
      expect(unit_plan.reload.status).to eq("published")
    end

    it "raises error when status is not draft" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user, status: "published")

      expect { unit_plan.publish! }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "raises error when no current version exists" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user, status: "draft")

      expect { unit_plan.publish! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "#archive!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "transitions status from published to archived" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user, status: "published")

      unit_plan.archive!
      expect(unit_plan.reload.status).to eq("archived")
    end

    it "raises error when status is not published" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user, status: "draft")

      expect { unit_plan.archive! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
