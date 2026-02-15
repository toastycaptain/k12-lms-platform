require "rails_helper"

RSpec.describe LtiResourceLinkPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:lti_resource_link, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits admin and teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student" do
      expect(policy).not_to permit(student, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admin only" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(teacher, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:link1) { create(:lti_resource_link, tenant: tenant) }
    let!(:link2) { create(:lti_resource_link, tenant: tenant) }

    it "returns all for admin and teacher" do
      expect(described_class::Scope.new(admin, LtiResourceLink).resolve).to contain_exactly(link1, link2)
      expect(described_class::Scope.new(teacher, LtiResourceLink).resolve).to contain_exactly(link1, link2)
    end

    it "returns none for students" do
      expect(described_class::Scope.new(student, LtiResourceLink).resolve).to be_empty
    end
  end
end
