require "rails_helper"

RSpec.describe AnnouncementPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:announcement, tenant: tenant, created_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits all users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admins and teachers" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies students" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:published_announcement) { create(:announcement, tenant: tenant, published_at: Time.current) }
    let!(:draft_announcement) { create(:announcement, tenant: tenant, published_at: nil) }

    it "returns all for teachers" do
      expect(described_class::Scope.new(teacher, Announcement).resolve).to include(published_announcement, draft_announcement)
    end

    it "returns only published for students" do
      expect(described_class::Scope.new(student, Announcement).resolve).to contain_exactly(published_announcement)
    end
  end
end
