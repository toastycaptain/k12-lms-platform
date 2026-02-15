require "rails_helper"

RSpec.describe TemplateVersion, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:template) }
    it { should have_many(:template_version_standards).dependent(:destroy) }
    it { should have_many(:standards).through(:template_version_standards) }
  end

  describe "validations" do
    it { should validate_presence_of(:version_number) }
    it { should validate_presence_of(:title) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      v1 = create(:template_version, tenant: t1)
      Current.tenant = t2
      create(:template_version, tenant: t2)

      Current.tenant = t1
      expect(TemplateVersion.all).to contain_exactly(v1)
    end
  end
end
