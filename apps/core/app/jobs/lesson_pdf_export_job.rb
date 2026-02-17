Prawn::Fonts::AFM.hide_m17n_warning = true

class LessonPdfExportJob < ApplicationJob
  queue_as :default

  def perform(lesson_plan_id)
    lesson_plan = LessonPlan.unscoped.includes(:lesson_versions, :current_version).find(lesson_plan_id)
    Current.tenant = lesson_plan.tenant

    version = lesson_plan.current_version || lesson_plan.lesson_versions.order(version_number: :desc).first
    return unless version

    lesson_plan.exported_pdf.attach(
      io: StringIO.new(generate_pdf(lesson_plan, version)),
      filename: "#{lesson_plan.title.parameterize}-v#{version.version_number}.pdf",
      content_type: "application/pdf"
    )
  end

  private

  def generate_pdf(lesson_plan, version)
    Prawn::Document.new do |pdf|
      pdf.text lesson_plan.title, size: 24, style: :bold
      pdf.move_down 8
      pdf.text "Version #{version.version_number}", size: 12, color: "666666"
      pdf.move_down 4
      pdf.text "Duration: #{version.duration_minutes} minutes" if version.duration_minutes.present?
      pdf.move_down 16

      render_section(pdf, "Objectives", version.objectives)
      render_section(pdf, "Activities", version.activities)
      render_section(pdf, "Materials", version.materials)
    end.render
  end

  def render_section(pdf, heading, body)
    return if body.blank?

    pdf.text heading, size: 16, style: :bold
    pdf.move_down 4
    pdf.text body
    pdf.move_down 12
  end
end
