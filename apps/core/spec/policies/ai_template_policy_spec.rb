require "rails_helper"

RSpec.describe AiTemplatePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:admin) do
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    user
  end
  let(:teacher) do
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end
  let(:record) { create(:ai_template, tenant: tenant, created_by: admin) }

  permissions :index?, :show? do
    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "permits teachers" do
      expect(policy).to permit(teacher, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies teachers" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:active_template) { create(:ai_template, tenant: tenant, created_by: admin, status: "active") }
    let!(:draft_template) { create(:ai_template, tenant: tenant, created_by: admin, status: "draft", name: "Draft") }

    it "returns all for admin" do
      scope = AiTemplatePolicy::Scope.new(admin, AiTemplate).resolve

      expect(scope).to include(active_template, draft_template)
    end

    it "returns only active for teacher" do
      scope = AiTemplatePolicy::Scope.new(teacher, AiTemplate).resolve

      expect(scope).to include(active_template)
      expect(scope).not_to include(draft_template)
    end
  end
end
