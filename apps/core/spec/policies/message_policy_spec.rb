require "rails_helper"

RSpec.describe MessagePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }
  let(:other_user) { create(:user, tenant: tenant) }
  let(:message_thread) { create(:message_thread, tenant: tenant) }

  let(:record) do
    create(:message, tenant: tenant, message_thread: message_thread, sender: user)
  end

  before do
    Current.tenant = tenant
  end

  after { Current.tenant = nil }

  permissions :create?, :show? do
    context "when user participates in thread" do
      before do
        create(:message_thread_participant, tenant: tenant, message_thread: message_thread, user: user)
      end

      it "permits access" do
        expect(policy).to permit(user, record)
      end
    end

    context "when user does not participate in thread" do
      it "denies access" do
        expect(policy).not_to permit(other_user, record)
      end
    end
  end

  describe "Scope" do
    let!(:participating_thread) do
      thread = create(:message_thread, tenant: tenant)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: user)
      thread
    end
    let!(:accessible_message) { create(:message, tenant: tenant, message_thread: participating_thread, sender: user) }
    let!(:inaccessible_message) { create(:message, tenant: tenant, message_thread: message_thread, sender: other_user) }

    it "returns only messages in participated threads" do
      scope = described_class::Scope.new(user, Message).resolve
      expect(scope).to include(accessible_message)
      expect(scope).not_to include(inaccessible_message)
    end
  end
end
