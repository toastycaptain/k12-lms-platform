require "rails_helper"

RSpec.describe NotificationPreference, type: :model do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:user) }
  end

  describe "validations" do
    subject(:notification_preference) { build(:notification_preference, tenant: tenant, user: user) }

    it { should validate_presence_of(:event_type) }
    it { should validate_inclusion_of(:event_type).in_array(described_class::EVENT_TYPES.keys) }
    it { should validate_inclusion_of(:email_frequency).in_array(described_class::EMAIL_FREQUENCIES) }
    it { should validate_uniqueness_of(:user_id).scoped_to(:event_type) }
  end

  describe ".for_user" do
    it "returns defaults for event types without persisted rows" do
      preferences = described_class.for_user(user)

      expect(preferences["assignment_created"]).to eq(
        in_app: true,
        email: true,
        email_frequency: "immediate"
      )
      expect(preferences["message_received"]).to eq(
        in_app: true,
        email: true,
        email_frequency: "immediate"
      )
    end

    it "returns persisted values for event types that were customized" do
      create(
        :notification_preference,
        tenant: tenant,
        user: user,
        event_type: "message_received",
        in_app: false,
        email: false,
        email_frequency: "never"
      )

      preferences = described_class.for_user(user)

      expect(preferences["message_received"]).to eq(
        in_app: false,
        email: false,
        email_frequency: "never"
      )
    end
  end
end
