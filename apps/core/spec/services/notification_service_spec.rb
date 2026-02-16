require "rails_helper"

RSpec.describe NotificationService do
  let(:tenant) { create(:tenant) }
  let(:actor) { create(:user, tenant: tenant) }
  let(:recipient) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe ".notify" do
    it "creates a notification when tenant is present" do
      result = described_class.notify(
        user: recipient,
        type: "assignment_published",
        title: "Assignment published",
        message: "New assignment is available",
        url: "/assignments/1",
        actor: actor
      )

      expect(result).to be_a(Notification)
      expect(result.notification_type).to eq("assignment_published")
      expect(result.user_id).to eq(recipient.id)
      expect(result.actor_id).to eq(actor.id)
      expect(result.url).to eq("/assignments/1")
    end

    it "returns nil and does not create a notification when tenant is missing" do
      Current.tenant = nil

      expect {
        described_class.notify(user: recipient, type: "assignment_published", title: "Assignment")
      }.not_to change(Notification, :count)
    end

    it "swallows errors and returns nil" do
      allow(Rails.logger).to receive(:warn)

      result = described_class.notify(user: nil, type: "assignment_published", title: "Assignment")

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
          type: "announcement_posted",
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

      result = described_class.notify_enrolled_students(course: course, type: "announcement_posted", title: "New")

      expect(result).to be_nil
      expect(Rails.logger).to have_received(:warn).with(/notification\.notify_enrolled_students_failed/)
    end
  end
end
