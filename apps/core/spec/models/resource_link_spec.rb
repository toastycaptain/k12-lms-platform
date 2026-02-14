require "rails_helper"

RSpec.describe ResourceLink, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:linkable) }
  end

  describe "validations" do
    it { should validate_presence_of(:url) }
    it { should validate_presence_of(:provider) }
    it { should validate_presence_of(:tenant_id) }

    describe "url format" do
      let(:tenant) { create(:tenant) }

      before { Current.tenant = tenant }
      after { Current.tenant = nil }

      it "accepts valid URLs" do
        ay = create(:academic_year, tenant: tenant)
        course = create(:course, tenant: tenant, academic_year: ay)
        user = create(:user, tenant: tenant)
        unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
        version = unit_plan.create_version!(title: "v1")

        link = build(:resource_link, tenant: tenant, linkable: version, url: "https://example.com/doc")
        expect(link).to be_valid
      end

      it "rejects invalid URLs" do
        ay = create(:academic_year, tenant: tenant)
        course = create(:course, tenant: tenant, academic_year: ay)
        user = create(:user, tenant: tenant)
        unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
        version = unit_plan.create_version!(title: "v1")

        link = build(:resource_link, tenant: tenant, linkable: version, url: "not-a-url")
        expect(link).not_to be_valid
        expect(link.errors[:url]).to be_present
      end
    end

    describe "drive_file_id for google_drive provider" do
      let(:tenant) { create(:tenant) }

      before { Current.tenant = tenant }
      after { Current.tenant = nil }

      it "requires drive_file_id when provider is google_drive" do
        ay = create(:academic_year, tenant: tenant)
        course = create(:course, tenant: tenant, academic_year: ay)
        user = create(:user, tenant: tenant)
        unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
        version = unit_plan.create_version!(title: "v1")

        link = build(:resource_link, tenant: tenant, linkable: version, provider: "google_drive", drive_file_id: nil)
        expect(link).not_to be_valid
        expect(link.errors[:drive_file_id]).to be_present
      end

      it "is valid with drive_file_id when provider is google_drive" do
        ay = create(:academic_year, tenant: tenant)
        course = create(:course, tenant: tenant, academic_year: ay)
        user = create(:user, tenant: tenant)
        unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
        version = unit_plan.create_version!(title: "v1")

        link = build(:resource_link, tenant: tenant, linkable: version, provider: "google_drive", drive_file_id: "abc123")
        expect(link).to be_valid
      end
    end
  end

  describe "polymorphic association" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "works with UnitVersion" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      version = unit_plan.create_version!(title: "v1")

      link = create(:resource_link, tenant: tenant, linkable: version)
      expect(link.linkable).to eq(version)
      expect(version.resource_links).to include(link)
    end

    it "works with LessonVersion" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: user)
      version = lesson_plan.create_version!(title: "v1")

      link = create(:resource_link, tenant: tenant, linkable: version)
      expect(link.linkable).to eq(version)
      expect(version.resource_links).to include(link)
    end
  end
end
