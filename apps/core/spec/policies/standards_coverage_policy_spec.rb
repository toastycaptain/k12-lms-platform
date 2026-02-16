require "rails_helper"

RSpec.describe StandardsCoveragePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { user = create(:user, tenant: tenant); user.add_role(:admin); user }
  let(:curriculum_lead) { user = create(:user, tenant: tenant); user.add_role(:curriculum_lead); user }
  let(:teacher) { user = create(:user, tenant: tenant); user.add_role(:teacher); user }
  let(:student) { user = create(:user, tenant: tenant); user.add_role(:student); user }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits admin, curriculum lead, and teacher" do
      expect(policy).to permit(admin, :standards_coverage)
      expect(policy).to permit(curriculum_lead, :standards_coverage)
      expect(policy).to permit(teacher, :standards_coverage)
    end

    it "denies students" do
      expect(policy).not_to permit(student, :standards_coverage)
    end
  end
end
