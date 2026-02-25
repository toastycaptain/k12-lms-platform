require "rails_helper"

RSpec.describe MissingWorkJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:teacher) do
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end
  let(:student_one) do
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end
  let(:student_two) do
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let!(:assignment) do
    create(
      :assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      status: "published",
      due_at: 2.days.ago
    )
  end

  before do
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student_one, section: section, role: "student")
    create(:enrollment, tenant: tenant, user: student_two, section: section, role: "student")
  end

  it "creates missing submissions for students with no submission" do
    expect do
      described_class.perform_now(Time.current)
    end.to change(Submission, :count).by(2)

    statuses = Submission.where(assignment: assignment).pluck(:status)
    expect(statuses).to all(eq("missing"))
  end

  it "updates existing unsubmitted drafts to missing" do
    submission = create(:submission, tenant: tenant, assignment: assignment, user: student_one, status: "draft", submitted_at: nil)

    described_class.perform_now(Time.current)

    expect(submission.reload.status).to eq("missing")
  end

  it "does not override submitted work" do
    submitted = create(
      :submission,
      tenant: tenant,
      assignment: assignment,
      user: student_one,
      status: "submitted",
      submitted_at: 1.day.ago
    )

    described_class.perform_now(Time.current)

    expect(submitted.reload.status).to eq("submitted")
  end
end
