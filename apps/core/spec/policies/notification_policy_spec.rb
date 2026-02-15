require "rails_helper"

RSpec.describe NotificationPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:other_user) { create(:user, tenant: tenant) }
  let(:record) { create(:notification, tenant: tenant, user: user) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :unread_count?, :mark_all_read? do
    it "permits authenticated users" do
      expect(policy).to permit(user, record)
    end
  end

  permissions :show?, :update?, :read? do
    it "permits owner" do
      expect(policy).to permit(user, record)
    end

    it "denies non-owner" do
      expect(policy).not_to permit(other_user, record)
    end
  end

  describe "Scope" do
    let!(:owned_notification) { create(:notification, tenant: tenant, user: user) }
    let!(:other_notification) { create(:notification, tenant: tenant, user: other_user) }

    it "returns only owned notifications" do
      scope = described_class::Scope.new(user, Notification).resolve
      expect(scope).to contain_exactly(owned_notification)
      expect(scope).not_to include(other_notification)
    end
  end
end
