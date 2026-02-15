require "rails_helper"

RSpec.describe Notification, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:actor).class_name("User").optional }
    it { should belong_to(:notifiable).optional }
  end

  describe "validations" do
    it { should validate_presence_of(:notification_type) }
    it { should validate_presence_of(:title) }
  end

  describe "helpers" do
    it "marks unread notifications as read" do
      notification = create(:notification, tenant: tenant, read_at: nil)

      expect(notification.read?).to be(false)
      notification.read!
      expect(notification.reload.read?).to be(true)
    end
  end
end
