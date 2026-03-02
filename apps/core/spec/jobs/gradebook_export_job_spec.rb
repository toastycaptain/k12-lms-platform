require "rails_helper"

RSpec.describe GradebookExportJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "generates and attaches gradebook CSV export and writes an audit event" do
    payload = {
      students: [
        {
          name: "Sam Student",
          email: "sam@student.edu",
          grades: [ { grade: 92, missing: false, late: false } ],
          course_average: 92,
          missing_count: 0,
          late_count: 0,
          mastery: nil
        }
      ],
      assignments: [
        { title: "Unit Reflection", average: 92 }
      ],
      course_summary: {
        overall_average: 92,
        students_with_missing_work: 0
      }
    }

    expect {
      described_class.perform_now(course.id, payload, admin.id)
    }.to change(AuditLog.unscoped, :count).by(1)

    course.reload
    expect(course.gradebook_export).to be_attached
    expect(course.gradebook_export.blob.filename.to_s).to include("gradebook-#{course.id}")
    expect(course.gradebook_export.download).to include("Student Name,Email,Unit Reflection,Course Average,Missing,Late,Mastery")
    expect(AuditLog.unscoped.order(:id).last.event_type).to eq("gradebook.export_async.completed")
  end
end
