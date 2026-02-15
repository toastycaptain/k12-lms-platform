require "rails_helper"

RSpec.describe TemplateVersionPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:template) { create(:template, tenant: tenant, created_by: admin) }
  let(:record) { create(:template_version, tenant: tenant, template: template) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :show? do
    it "permits all roles" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end
  end

  permissions :update? do
    it "permits admin and curriculum lead" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
    end

    it "denies teacher" do
      expect(policy).not_to permit(teacher, record)
    end
  end
end
