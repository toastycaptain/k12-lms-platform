require "rails_helper"

RSpec.describe MessageThreadParticipant, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:message_thread) }
    it { should belong_to(:user) }
  end

  describe "validations" do
    it "enforces user uniqueness within a message thread" do
      participant = create(:message_thread_participant, tenant: tenant)
      duplicate = build(
        :message_thread_participant,
        tenant: tenant,
        message_thread: participant.message_thread,
        user: participant.user
      )

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:user_id]).to include("has already been taken")
    end

    it "requires tenant" do
      Current.tenant = nil
      participant = build(:message_thread_participant, tenant: nil)

      expect(participant).not_to be_valid
      expect(participant.errors[:tenant]).to be_present
    end
  end

  describe "#mark_read!" do
    it "sets last_read_at" do
      participant = create(:message_thread_participant, tenant: tenant, last_read_at: nil)

      participant.mark_read!

      expect(participant.reload.last_read_at).to be_present
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)

      Current.tenant = t1
      p1 = create(:message_thread_participant, tenant: t1)

      Current.tenant = t2
      create(:message_thread_participant, tenant: t2)

      Current.tenant = t1
      expect(described_class.all).to contain_exactly(p1)
    end
  end
end
