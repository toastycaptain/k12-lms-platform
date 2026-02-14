require "rails_helper"

RSpec.describe TemplateVersionStandard, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:template_version) }
    it { should belong_to(:standard) }
  end

  describe "validations" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "enforces uniqueness of standard per template version" do
      user = create(:user, tenant: tenant)
      template = create(:template, tenant: tenant, created_by: user)
      version = template.create_version!(title: "v1")
      framework = create(:standard_framework, tenant: tenant)
      standard = create(:standard, tenant: tenant, standard_framework: framework)

      create(:template_version_standard, tenant: tenant, template_version: version, standard: standard)
      duplicate = build(:template_version_standard, tenant: tenant, template_version: version, standard: standard)

      expect(duplicate).not_to be_valid
    end
  end
end
