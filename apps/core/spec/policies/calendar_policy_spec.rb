require "rails_helper"

RSpec.describe CalendarPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

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

  let(:student) do
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits admin" do
      expect(policy).to permit(admin, :calendar)
    end

    it "permits teacher" do
      expect(policy).to permit(teacher, :calendar)
    end

    it "permits student" do
      expect(policy).to permit(student, :calendar)
    end
  end
end
