require "rails_helper"

RSpec.describe Message, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "associations" do
    it { should belong_to(:message_thread) }
    it { should belong_to(:sender).class_name("User") }
  end

  describe "validations" do
    it { should validate_presence_of(:body) }
  end

  describe "callbacks" do
    it "touches thread updated_at after create" do
      thread = create(:message_thread, tenant: tenant)
      sender = create(:user, tenant: tenant)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: sender)

      thread.update_column(:updated_at, 5.minutes.ago) # rubocop:disable Rails/SkipsModelValidations
      original_updated_at = thread.reload.updated_at
      create(:message, tenant: tenant, message_thread: thread, sender: sender)

      expect(thread.reload.updated_at).to be > original_updated_at
    end

    it "creates notifications for other participants" do
      thread = create(:message_thread, tenant: tenant)
      sender = create(:user, tenant: tenant)
      recipient = create(:user, tenant: tenant)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: sender)
      create(:message_thread_participant, tenant: tenant, message_thread: thread, user: recipient)

      expect {
        create(:message, tenant: tenant, message_thread: thread, sender: sender, body: "New update")
      }.to change { Notification.where(user: recipient).count }.by(1)
        .and change { Notification.where(user: sender).count }.by(0)
    end
  end
end
