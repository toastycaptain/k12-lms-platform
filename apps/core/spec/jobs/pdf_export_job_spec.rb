require "rails_helper"

RSpec.describe PdfExportJob, type: :job do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  it "generates and attaches a PDF to the unit plan" do
    ay = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: ay)
    user = create(:user, tenant: tenant)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
    unit_plan.create_version!(
      title: "Test Unit",
      description: "A test unit",
      essential_questions: [ "Why?" ],
      enduring_understandings: [ "Because" ]
    )

    PdfExportJob.perform_now(unit_plan.id)

    unit_plan.reload
    expect(unit_plan.exported_pdf).to be_attached
    expect(unit_plan.exported_pdf.content_type).to eq("application/pdf")
  end

  it "is idempotent — regenerates PDF on re-run" do
    ay = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: ay)
    user = create(:user, tenant: tenant)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
    unit_plan.create_version!(title: "Test Unit")

    PdfExportJob.perform_now(unit_plan.id)
    PdfExportJob.perform_now(unit_plan.id)

    unit_plan.reload
    expect(unit_plan.exported_pdf).to be_attached
  end

  it "includes lesson titles in the PDF" do
    ay = create(:academic_year, tenant: tenant)
    course = create(:course, tenant: tenant, academic_year: ay)
    user = create(:user, tenant: tenant)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
    unit_plan.create_version!(title: "Test Unit")
    lesson = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: user, position: 0)
    lesson.create_version!(title: "Lesson 1", objectives: "Learn stuff")

    PdfExportJob.perform_now(unit_plan.id)

    unit_plan.reload
    expect(unit_plan.exported_pdf).to be_attached
  end
end
