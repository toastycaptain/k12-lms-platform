require "rails_helper"

RSpec.describe LessonPdfExportJob, type: :job do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  it "generates and attaches a PDF to the lesson plan" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    teacher = create(:user, tenant: tenant)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
    lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: teacher, title: "Lesson 1", position: 0)
    lesson_plan.create_version!(
      title: "Lesson 1 Draft",
      objectives: "Understand fractions",
      activities: "Partner practice",
      materials: "Fraction tiles",
      duration_minutes: 45
    )

    LessonPdfExportJob.perform_now(lesson_plan.id)

    lesson_plan.reload
    expect(lesson_plan.exported_pdf).to be_attached
    expect(lesson_plan.exported_pdf.content_type).to eq("application/pdf")
  end

  it "falls back to latest version when current_version is missing" do
    academic_year = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: academic_year)
    teacher = create(:user, tenant: tenant)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
    lesson_plan = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: teacher, title: "Lesson 2", position: 1)
    lesson_plan.create_version!(title: "v1", objectives: "First objective")
    lesson_plan.create_version!(title: "v2", objectives: "Second objective")
    lesson_plan.update!(current_version: nil)

    LessonPdfExportJob.perform_now(lesson_plan.id)

    lesson_plan.reload
    expect(lesson_plan.exported_pdf).to be_attached
    expect(lesson_plan.exported_pdf.filename.to_s).to include("lesson-2-v2")
  end
end
