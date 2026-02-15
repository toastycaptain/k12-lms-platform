require "rails_helper"

RSpec.describe MessageThreadPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:other_user) { create(:user, tenant: tenant) }
  let(:message_thread) { create(:message_thread, tenant: tenant) }

  before do
    Current.tenant = tenant
  end

  after { Current.tenant = nil }

  permissions :index?, :create? do
    it "permits authenticated users" do
      expect(policy).to permit(user, message_thread)
    end
  end

  permissions :show?, :destroy? do
    before do
      create(:message_thread_participant, tenant: tenant, message_thread: message_thread, user: user)
    end

    it "permits participants" do
      expect(policy).to permit(user, message_thread)
    end

    it "denies non-participants" do
      expect(policy).not_to permit(other_user, message_thread)
    end
  end

  describe "Scope" do
    let!(:participated_thread) do
      thread = create(:message_thread, tenant: tenant)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: user)
      thread
    end
    let!(:other_thread) { create(:message_thread, tenant: tenant) }

    it "returns only participant threads" do
      scope = described_class::Scope.new(user, MessageThread).resolve
      expect(scope).to contain_exactly(participated_thread)
      expect(scope).not_to include(other_thread)
    end
  end
end
