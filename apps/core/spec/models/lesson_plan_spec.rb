require "rails_helper"

RSpec.describe LessonPlan, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:unit_plan) }
    it { should belong_to(:created_by).class_name("User") }
    it { should belong_to(:current_version).class_name("LessonVersion").optional }
    it { should have_many(:lesson_versions).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:status) }
    it { should validate_presence_of(:tenant_id) }
    it { should validate_presence_of(:position) }
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
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: user)

      v1 = lesson_plan.create_version!(title: "First Draft")
      expect(v1.version_number).to eq(1)

      v2 = lesson_plan.create_version!(title: "Revised")
      expect(v2.version_number).to eq(2)
    end

    it "sets the current_version on the lesson plan" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: user)

      version = lesson_plan.create_version!(title: "Draft")
      expect(lesson_plan.reload.current_version).to eq(version)
    end

    it "stores objectives, activities, materials, and duration" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: user)

      version = lesson_plan.create_version!(
        title: "Lesson 1",
        objectives: "Learn fractions",
        activities: "Worksheet + discussion",
        materials: "Textbook p.42",
        duration_minutes: 50
      )

      expect(version.objectives).to eq("Learn fractions")
      expect(version.activities).to eq("Worksheet + discussion")
      expect(version.materials).to eq("Textbook p.42")
      expect(version.duration_minutes).to eq(50)
    end
  end
end
