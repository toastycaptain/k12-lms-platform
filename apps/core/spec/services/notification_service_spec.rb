require "rails_helper"

RSpec.describe NotificationService do
  include ActiveJob::TestHelper

  let(:tenant) { create(:tenant) }
  let(:actor) { create(:user, tenant: tenant) }
  let(:recipient) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe ".notify" do
    before { clear_enqueued_jobs }

    it "creates in-app notifications by default and enqueues immediate email" do
      expect {
        described_class.notify(
          user: recipient,
          event_type: "assignment_created",
          title: "Assignment published",
          message: "New assignment is available",
          url: "/assignments/1",
          actor: actor
        )
      }.to change(Notification, :count).by(1)
        .and have_enqueued_mail(NotificationMailer, :notification_email)

      notification = Notification.order(:id).last
      expect(notification.notification_type).to eq("assignment_created")
      expect(notification.user_id).to eq(recipient.id)
      expect(notification.actor_id).to eq(actor.id)
      expect(notification.url).to eq("/assignments/1")
    end

    it "respects in_app preference when disabled but still sends immediate email" do
      create(
        :notification_preference,
        tenant: tenant,
        user: recipient,
        event_type: "assignment_created",
        in_app: false,
        email: true,
        email_frequency: "immediate"
      )

      expect {
        described_class.notify(
          user: recipient,
          event_type: "assignment_created",
          title: "Assignment published"
        )
      }.not_to change(Notification, :count)
      expect(enqueued_jobs.size).to eq(1)
    end

    it "does not enqueue immediate email for digest frequencies" do
      create(
        :notification_preference,
        tenant: tenant,
        user: recipient,
        event_type: "assignment_created",
        in_app: true,
        email: true,
        email_frequency: "daily"
      )

      described_class.notify(
        user: recipient,
        event_type: "assignment_created",
        title: "Assignment published"
      )

      expect(enqueued_jobs).to be_empty
    end

    it "swallows errors and returns nil" do
      allow(Rails.logger).to receive(:warn)
      allow(Notification).to receive(:create!).and_raise(StandardError.new("boom"))

      result = described_class.notify(user: recipient, event_type: "assignment_created", title: "Assignment")

      expect(result).to be_nil
      expect(Rails.logger).to have_received(:warn).with(/notification\.notify_failed/)
    end
  end

  describe ".notify_enrolled_students" do
    let(:academic_year) { create(:academic_year, tenant: tenant) }
    let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
    let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
    let(:section_a) { create(:section, tenant: tenant, course: course, term: term) }
    let(:section_b) { create(:section, tenant: tenant, course: course, term: term) }
    let(:student_one) { create(:user, tenant: tenant) }
    let(:student_two) { create(:user, tenant: tenant) }
    let(:teacher) { create(:user, tenant: tenant) }

    before do
      create(:enrollment, tenant: tenant, section: section_a, user: student_one, role: "student")
      create(:enrollment, tenant: tenant, section: section_b, user: student_one, role: "student")
      create(:enrollment, tenant: tenant, section: section_b, user: student_two, role: "student")
      create(:enrollment, tenant: tenant, section: section_a, user: teacher, role: "teacher")
    end

    it "notifies each enrolled student exactly once" do
      expect {
        described_class.notify_enrolled_students(
          course: course,
          event_type: "announcement_posted",
          title: "New announcement",
          message: "Check updates"
        )
      }.to change(Notification, :count).by(2)

      user_ids = Notification.order(:id).last(2).map(&:user_id)
      expect(user_ids).to contain_exactly(student_one.id, student_two.id)
    end

    it "returns nil and logs when an error occurs" do
      allow(Enrollment).to receive(:where).and_raise(StandardError.new("boom"))
      allow(Rails.logger).to receive(:warn)

      result = described_class.notify_enrolled_students(course: course, event_type: "announcement_posted", title: "New")

      expect(result).to be_nil
      expect(Rails.logger).to have_received(:warn).with(/notification\.notify_enrolled_students_failed/)
    end
  end
end
