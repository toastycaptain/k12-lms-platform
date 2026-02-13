require "rails_helper"

RSpec.describe Template, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:created_by).class_name("User") }
    it { should belong_to(:current_version).class_name("TemplateVersion").optional }
    it { should have_many(:template_versions).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:status) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "#create_version!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "creates a new version with auto-incremented version_number" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user)

      v1 = template.create_version!(title: "First Draft")
      expect(v1.version_number).to eq(1)

      v2 = template.create_version!(title: "Revised")
      expect(v2.version_number).to eq(2)
    end

    it "sets the current_version on the template" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user)

      version = template.create_version!(title: "Draft")
      expect(template.reload.current_version).to eq(version)
    end
  end

  describe "#publish!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "transitions status from draft to published" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user, status: "draft")
      template.create_version!(title: "v1")

      template.publish!
      expect(template.reload.status).to eq("published")
    end

    it "raises error when status is not draft" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user, status: "published")

      expect { template.publish! }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "raises error when no current version exists" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user, status: "draft")

      expect { template.publish! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "#archive!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "transitions status from published to archived" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user, status: "published")

      template.archive!
      expect(template.reload.status).to eq("archived")
    end

    it "raises error when status is not published" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user, status: "draft")

      expect { template.archive! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
