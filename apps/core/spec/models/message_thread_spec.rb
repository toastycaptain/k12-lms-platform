require "rails_helper"

RSpec.describe MessageThread, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course).optional }
    it { should have_many(:message_thread_participants).dependent(:destroy) }
    it { should have_many(:participants).through(:message_thread_participants) }
    it { should have_many(:messages).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:subject) }
    it { should validate_presence_of(:thread_type) }
    it { should validate_inclusion_of(:thread_type).in_array(MessageThread::VALID_TYPES) }
  end

  describe "#last_message" do
    it "returns the most recent message" do
      thread = create(:message_thread, tenant: tenant)
      first = create(:message, tenant: tenant, message_thread: thread, created_at: 2.minutes.ago)
      last = create(:message, tenant: tenant, message_thread: thread, created_at: 1.minute.ago)

      expect(thread.last_message).to eq(last)
      expect(thread.last_message).not_to eq(first)
    end
  end

  describe "#unread_count_for" do
    it "returns all messages when participant has not read" do
      thread = create(:message_thread, tenant: tenant)
      user = create(:user, tenant: tenant)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: user, last_read_at: nil)
      create_list(:message, 3, tenant: tenant, message_thread: thread)

      expect(thread.unread_count_for(user)).to eq(3)
    end

    it "returns messages created after last_read_at" do
      thread = create(:message_thread, tenant: tenant)
      user = create(:user, tenant: tenant)
      last_read_at = 1.minute.ago
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: user, last_read_at: last_read_at)
      create(:message, tenant: tenant, message_thread: thread, created_at: 2.minutes.ago)
      create(:message, tenant: tenant, message_thread: thread, created_at: 30.seconds.ago)

      expect(thread.unread_count_for(user)).to eq(1)
    end
  end
end
