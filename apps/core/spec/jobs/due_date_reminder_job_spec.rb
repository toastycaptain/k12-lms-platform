require "rails_helper"

RSpec.describe DueDateReminderJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:student) { create(:user, tenant: tenant) }
  let(:teacher) { create(:user, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:assignment) do
    create(
      :assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      status: "published",
      due_at: 12.hours.from_now
    )
  end

  before do
    Current.tenant = tenant
    student.add_role(:student)
    teacher.add_role(:teacher)
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "notifies students with unsubmitted assignments due in the next 24 hours" do
    assignment

    expect {
      described_class.perform_now(Time.current)
      Current.tenant = tenant
    }.to change(Notification, :count).by(1)

    reminder = Notification.order(:id).last
    expect(reminder.notification_type).to eq("assignment_due_soon")
    expect(reminder.user_id).to eq(student.id)
  end

  it "is idempotent for the same assignment/student pair" do
    assignment

    described_class.perform_now(Time.current)
    described_class.perform_now(Time.current)

    count = Notification.where(
      user_id: student.id,
      notification_type: "assignment_due_soon",
      notifiable_type: "Assignment",
      notifiable_id: assignment.id
    ).count
    expect(count).to eq(1)
  end

  it "does not notify students who already submitted" do
    assignment
    create(:submission, tenant: tenant, assignment: assignment, user: student, status: "submitted")

    described_class.perform_now(Time.current)

    expect(Notification.where(notification_type: "assignment_due_soon")).to be_empty
  end
end
