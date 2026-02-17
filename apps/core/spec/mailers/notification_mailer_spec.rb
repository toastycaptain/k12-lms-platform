require "rails_helper"

RSpec.describe NotificationMailer, type: :mailer do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant, first_name: "Pat", email: "pat@example.com") }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "#notification_email" do
    it "renders an immediate notification email with event-aware subject" do
      notification = create(
        :notification,
        tenant: tenant,
        user: user,
        notification_type: "assignment_graded",
        title: "Grade posted",
        message: "Your essay was graded.",
        metadata: { "assignment_title" => "Essay 1" }
      )

      mail = described_class.notification_email(
        user_id: user.id,
        event_type: "assignment_graded",
        title: notification.title,
        message: notification.message,
        url: "/learn/courses/1/assignments/1",
        metadata: notification.metadata,
        notification_id: notification.id
      )

      expect(mail.to).to eq([ user.email ])
      expect(mail.subject).to eq("Grade posted: Essay 1")
      expect(mail.body.encoded).to include("Your essay was graded.")
    end
  end

  describe "#daily_digest" do
    it "builds a digest containing unread notification rows" do
      n1 = create(:notification, tenant: tenant, user: user, title: "A")
      n2 = create(:notification, tenant: tenant, user: user, title: "B")

      mail = described_class.daily_digest(user.id, [ n1.id, n2.id ], frequency: "daily")

      expect(mail.to).to eq([ user.email ])
      expect(mail.subject).to include("Daily Summary")
      expect(mail.body.encoded).to include("A")
      expect(mail.body.encoded).to include("B")
    end
  end
end
